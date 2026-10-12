import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { setImmediate as yieldTurn } from 'node:timers/promises';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { NATIVE_RECORD_FEATURES, NUMERIC_FIELDS, DATE_FIELDS, BOOLEAN_FIELDS, columnFor, demoLabel, recordCapabilities, presentNativeRecord } from '../services/nativeRecordCatalog.js';
import { assertNotAborted, seedNativeDemoData } from '../services/nativeDemoData.js';

const invalid = message => Object.assign(new Error(message), { status: 400 });
const missing = () => Object.assign(new Error('Record not found in your account'), { status: 404 });
const retained = reason => Object.assign(new Error(reason || 'This record is retained in its authorized workflow'), { status: 409 });
const integerFields = new Set(['child_age', 'marriage_duration', 'num_children']);
const finalizedStatuses = new Set(['approved', 'filed', 'executed', 'signed', 'attorney_reviewed', 'verified', 'paid']);
const refConfigs = Object.entries(NATIVE_RECORD_FEATURES).filter(([, config]) => !config.upload && !config.conversation && !config.calendar && !config.operations && !config.researchTemplate && !config.aliases);
const selected = config => `*,updated_at::text AS record_version${config.calendar ? ",COALESCE(native_date_instant,date AT TIME ZONE current_setting('TimeZone')) AS date" : ''}`;
const parameterFor = (config, field, number) => config.calendar && field === 'date' ? `$${number}::timestamptz AT TIME ZONE current_setting('TimeZone')` : `$${number}`;

function requestScope(req, res, next) {
  const controller = new AbortController();
  if (req.aborted) controller.abort();
  const abort = () => controller.abort();
  const close = () => { if (!res.writableEnded) controller.abort(); };
  req.once('aborted', abort);
  res.once('close', close);
  res.once('finish', () => { req.off('aborted', abort); res.off('close', close); });
  req.recordSignal = controller.signal;
  next();
}

async function freshActor(database, req, lock = false) {
  if (!/^[1-9]\d*$/.test(String(req.user?.id || ''))) throw Object.assign(new Error('Sign in again with an existing account'), { status: 401 });
  const actor = (await database.query(`SELECT id,name,email,role FROM users WHERE id=$1${lock ? ' FOR SHARE' : ''}`, [req.user.id])).rows[0];
  if (!actor || (req.user.email && actor.email !== req.user.email)) throw Object.assign(new Error('This session no longer identifies the current account. Sign in again.'), { status: 401 });
  assertNotAborted(req.recordSignal);
  return actor;
}

function fieldsFromBody(config, body, { creating = false, row = null } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('A record object is required');
  const allowed = new Set([...config.fields, 'is_demo', 'recordVersion']);
  for (const key of Object.keys(body)) if (!allowed.has(key)) throw invalid(`Field ${key} is server-owned or outside this record's editable fields`);
  if (body.is_demo !== undefined && typeof body.is_demo !== 'boolean') throw invalid('is_demo must be a boolean');
  if (!creating && body.is_demo !== undefined && body.is_demo !== Boolean(row.is_demo)) throw invalid('The record origin label cannot be changed');
  if (body.recordVersion !== undefined && typeof body.recordVersion !== 'string') throw invalid('recordVersion must identify the loaded record');
  const values = {};
  for (const field of config.fields) {
    if (body[field] === undefined) continue;
    const input = body[field];
    if (input === null || input === '') { values[columnFor(config, field)] = null; continue; }
    let value;
    if (BOOLEAN_FIELDS.has(field)) {
      if (typeof input !== 'boolean') throw invalid(`${field} must be true or false`);
      value = input;
    } else if (NUMERIC_FIELDS.has(field)) {
      if (!['string', 'number'].includes(typeof input) || !Number.isFinite(Number(input))) throw invalid(`${field} must be a finite number`);
      value = Number(input);
      if (integerFields.has(field) && (!Number.isInteger(value) || value < 0)) throw invalid(`${field} must be a non-negative whole number`);
    } else if (DATE_FIELDS.has(field)) {
      if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input) || !Number.isFinite(Date.parse(input + 'T12:00:00Z')) || new Date(input + 'T12:00:00Z').toISOString().slice(0, 10) !== input) throw invalid(`${field} must be an actual YYYY-MM-DD date`);
      value = input;
    } else if (field === 'date') {
      if (typeof input !== 'string' || !Number.isFinite(Date.parse(input))) throw invalid('date must be an actual date and time');
      value = new Date(input).toISOString();
    } else if (field === 'case_id') {
      if (!/^[1-9]\d*$/.test(String(input))) throw invalid('case_id must be an actual saved record ID');
      value = String(input);
    } else {
      if (typeof input !== 'string') throw invalid(`${field} must be text`);
      value = input.trim();
      if (value.length > (['content', 'text_content', 'description', 'notes', 'research_question', 'followUp', 'key_terms', 'definition', 'context'].includes(field) ? 1000000 : 10000)) throw invalid(`${field} is too long`);
    }
    values[columnFor(config, field)] = value;
  }
  for (const field of config.required) {
    const value = values[columnFor(config, field)] !== undefined ? values[columnFor(config, field)] : row?.[columnFor(config, field)];
    if (value === undefined || value === null || String(value).trim() === '') throw invalid(`${field} is required`);
  }
  if (!config.operations && finalizedStatuses.has(String(values.status || '').toLowerCase())) throw invalid('Legal approval, filing, signature and verification status belong to the authorized workflow');
  if (config.researchTemplate && values.state_code !== undefined) {
    if (!/^[A-Za-z]{2}$/.test(values.state_code || '')) throw invalid('state_code must be a two-letter research jurisdiction label');
    values.state_code = values.state_code.toUpperCase();
  }
  if (config.aliases && values.severity !== undefined && !['low', 'medium', 'high'].includes(values.severity)) throw invalid('severity must be low, medium or high');
  return values;
}

async function validateReference(client, config, values, row, userId) {
  if (!config.conversation && !config.calendar) return;
  const caseId = values.case_id !== undefined ? values.case_id : row?.case_id;
  if (!caseId) return;
  const labelField = config.conversation ? 'case_table' : 'case_type';
  const label = values[labelField] !== undefined ? values[labelField] : row?.[labelField];
  const found = refConfigs.find(([feature, item]) => feature === label || item.table === label);
  if (!found) throw invalid(`${labelField} must identify the actual native collection for the selected case ID`);
  const result = await client.query(`SELECT id FROM ${found[1].table} WHERE id=$1 AND user_id=$2 FOR SHARE`, [caseId, userId]);
  if (!result.rows[0]) throw invalid('The linked case ID is not a saved record in your account');
  if (config.conversation) values.case_table = found[1].table;
}

function checkVersion(body, row) {
  if (body?.recordVersion !== undefined && body.recordVersion !== row.record_version) throw retained('This record changed since it was opened. Cancel and reload before editing or deleting.');
}

export function createNativeRecordsRouter({ database = pool, authenticate = auth } = {}) {
  const router = Router();
  router.use(requestScope, authenticate);
  router.use(async (req, res, next) => {
    try { req.recordActor = await freshActor(database, req); next(); } catch (error) { next(error); }
  });
  const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 } });
  const multipart = (req, res, next) => req.is('multipart/form-data') ? upload.single('file')(req, res, next) : next();

  async function transaction(req, work) {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const actor = await freshActor(client, req, true);
      const result = await work(client, actor);
      await yieldTurn();
      assertNotAborted(req.recordSignal);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }
  const configFor = feature => {
    const config = Object.prototype.hasOwnProperty.call(NATIVE_RECORD_FEATURES, feature) ? NATIVE_RECORD_FEATURES[feature] : null;
    if (!config) throw Object.assign(new Error('Unknown native record collection'), { status: 404 });
    return config;
  };
  const rowFor = async (client, config, id, userId, lock = false) => {
    if (!/^[1-9]\d*$/.test(String(id))) throw missing();
    const row = (await client.query(`SELECT ${selected(config)} FROM ${config.table} WHERE id=$1 AND user_id=$2${lock ? ' FOR UPDATE' : ''}`, [id, userId])).rows[0];
    if (!row) throw missing();
    return row;
  };
  const responseFor = (config, row) => ({ item: presentNativeRecord(config, row), capabilities: recordCapabilities(config, row) });

  router.get('/catalog', (req, res) => res.json({ features: Object.fromEntries(Object.entries(NATIVE_RECORD_FEATURES).map(([name, config]) => [name, { fields: config.fields, required: config.required, capabilities: recordCapabilities(config) }])) }));
  router.post('/demo', wrap(async (req, res) => {
    if (process.env.NODE_ENV === 'production') throw Object.assign(new Error('Synthetic examples are development-only'), { status: 403 });
    if (Object.keys(req.body || {}).length) throw invalid('This action prepares only the signed-in account with the fixed minimum of 15 examples');
    const result = await seedNativeDemoData(database, { userId: req.recordActor.id, signal: req.recordSignal, expectedEmail: req.user.email });
    if (!res.destroyed) res.json(result);
  }));

  router.get('/:feature', wrap(async (req, res) => {
    const config = configFor(req.params.feature);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1), limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const body = await transaction(req, async (client, actor) => {
      const total = Number((await client.query(`SELECT COUNT(*) FROM ${config.table} WHERE user_id=$1`, [actor.id])).rows[0].count);
      const data = (await client.query(`SELECT ${selected(config)} FROM ${config.table} WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3`, [actor.id, limit, (page - 1) * limit])).rows.map(row => presentNativeRecord(config, row));
      return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, capabilities: recordCapabilities(config), editableFields: config.fields };
    });
    if (!res.destroyed) res.json(body);
  }));
  router.get('/:feature/:id', wrap(async (req, res) => {
    const config = configFor(req.params.feature);
    const body = await transaction(req, async (client, actor) => responseFor(config, await rowFor(client, config, req.params.id, actor.id)));
    if (!res.destroyed) res.json(body);
  }));
  router.post('/:feature', multipart, wrap(async (req, res) => {
    const config = configFor(req.params.feature);
    const body = await transaction(req, async (client, actor) => {
      let values, isDemo = req.body?.is_demo === true;
      if (config.upload && req.file) {
        for (const key of Object.keys(req.body || {})) if (key !== 'document_type') throw invalid('Actual file uploads accept only the selected file and document_type');
        const mime = req.file.mimetype || 'application/octet-stream';
        let text;
        if (mime === 'application/pdf' || /\.pdf$/i.test(req.file.originalname)) {
          const module = await import('pdf-parse');
          const parsed = await (module.default || module)(req.file.buffer);
          text = parsed.text || '';
        } else if (mime.startsWith('text/') || /\.(txt|md|json)$/i.test(req.file.originalname)) text = req.file.buffer.toString('utf8');
        else throw invalid('Use a PDF or text file with extractable text');
        values = { filename: req.file.originalname.split(/[\\/]/).pop(), document_type: req.body.document_type || null, size_bytes: req.file.size, mime_type: mime, text_content: text };
        isDemo = false;
      } else {
        if (req.file) throw invalid('Files are supported only by the uploads collection');
        values = fieldsFromBody(config, req.body, { creating: true });
        if (config.upload) {
          if (!isDemo) throw invalid('Actual uploaded evidence requires a manually selected multipart file; generated text examples require is_demo=true');
          if (!values.text_content) throw invalid('A generated text example requires actual sample text_content');
          values.size_bytes = Buffer.byteLength(values.text_content, 'utf8');
          values.mime_type = 'text/plain';
        }
      }
      await validateReference(client, config, values, null, actor.id);
      if (config.conversation) values.messages = '[]';
      if (config.calendar) values.native_date_instant = values.date;
      values.is_demo = isDemo;
      values.demo_label = isDemo ? demoLabel : null;
      values.demo_key = isDemo ? `manual-example/${randomUUID()}` : null;
      const fields = ['user_id', ...Object.keys(values)], params = [actor.id, ...Object.values(values)];
      const row = (await client.query(`INSERT INTO ${config.table}(${fields.join(',')}) VALUES(${fields.map((field, i) => parameterFor(config, field, i + 1)).join(',')}) RETURNING ${selected(config)}`, params)).rows[0];
      return responseFor(config, row);
    });
    if (!res.destroyed) res.status(201).json(body);
  }));
  const update = wrap(async (req, res) => {
    const config = configFor(req.params.feature);
    const body = await transaction(req, async (client, actor) => {
      const row = await rowFor(client, config, req.params.id, actor.id, true);
      const values = fieldsFromBody(config, req.body, { row });
      checkVersion(req.body, row);
      const capabilities = recordCapabilities(config, row);
      if (!capabilities.canEdit) throw retained(capabilities.retainedReason || 'Actual uploaded source content remains immutable; use a new manual upload');
      if (!Object.keys(values).length) throw invalid('Supply at least one supported editable field');
      await validateReference(client, config, values, row, actor.id);
      if (config.calendar && values.date !== undefined) values.native_date_instant = values.date;
      if (config.upload) {
        const text = values.text_content !== undefined ? values.text_content : row.text_content;
        values.size_bytes = Buffer.byteLength(text || '', 'utf8');
      }
      const fields = Object.keys(values), params = [...Object.values(values), row.id, actor.id];
      const updated = (await client.query(`UPDATE ${config.table} SET ${fields.map((field, i) => `${field}=${parameterFor(config, field, i + 1)}`).join(',')},updated_at=NOW() WHERE id=$${params.length - 1} AND user_id=$${params.length} RETURNING ${selected(config)}`, params)).rows[0];
      return responseFor(config, updated);
    });
    if (!res.destroyed) res.json(body);
  });
  router.put('/:feature/:id', update);
  router.patch('/:feature/:id', update);
  router.delete('/:feature/:id', wrap(async (req, res) => {
    const config = configFor(req.params.feature);
    const body = await transaction(req, async (client, actor) => {
      const row = await rowFor(client, config, req.params.id, actor.id, true);
      for (const key of Object.keys(req.body || {})) if (key !== 'recordVersion') throw invalid('Delete accepts only the loaded recordVersion');
      checkVersion(req.body, row);
      const capabilities = recordCapabilities(config, row);
      if (!capabilities.canDelete) throw retained(capabilities.retainedReason);
      await client.query(`DELETE FROM ${config.table} WHERE id=$1 AND user_id=$2`, [row.id, actor.id]);
      return { deleted: true, id: row.id, capabilities };
    });
    if (!res.destroyed) res.json(body);
  }));
  router.post('/:feature/:id/analyze', wrap(async (req, res) => {
    const config = configFor(req.params.feature);
    await transaction(req, async (client, actor) => { await rowFor(client, config, req.params.id, actor.id); });
    if (!res.destroyed) res.status(410).json({ error: recordCapabilities(config).providerReason, canAnalyze: false });
  }));
  router.use((error, req, res, next) => {
    if (res.destroyed || req.recordSignal?.aborted) return;
    const storageMissing = ['42P01', '42703'].includes(error.code);
    const validation = ['22P02', '22007', '22008', '22001', '23502', '23514', '23503'].includes(error.code);
    const status = storageMissing ? 503 : error instanceof multer.MulterError ? 400 : error.status || (validation ? 400 : 500);
    res.status(status).json({ error: storageMissing ? 'Native record storage is not prepared. Apply the additive native migrations and preserving demo seed for your existing account.' : status === 500 ? 'The native record operation could not be completed. Existing records were preserved.' : error.message });
  });
  return router;
}

export default createNativeRecordsRouter();
