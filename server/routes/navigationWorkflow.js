import crypto from 'crypto';
import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { calculateCalendarDeadline, screenSafety, validateRule } from '../services/navigationPolicy.js';

const router = Router();
router.use(auth);
const id = () => crypto.randomUUID();
const respondError = (res, error) => res.status(error.status || 400).json({ error: error.message });

async function member(req, roles) {
  const workspaceId = req.params.workspaceId || req.body.workspaceId;
  const result = await pool.query('SELECT role FROM navigation_memberships WHERE workspace_id=$1 AND user_id=$2', [workspaceId, req.user.id]);
  if (!result.rows[0] || (roles && !roles.includes(result.rows[0].role))) {
    const error = new Error('Workspace role is not authorized'); error.status = 403; throw error;
  }
  return { workspaceId, role: result.rows[0].role };
}

async function audit(client, workspaceId, actor, action, entityType, entityId, reason = null, metadata = {}) {
  await client.query(`INSERT INTO navigation_audit_events
    (workspace_id,actor_user_id,action,entity_type,entity_id,reason,metadata) VALUES($1,$2,$3,$4,$5,$6,$7)`,
  [workspaceId, actor, action, entityType, entityId, reason, metadata]);
}

async function requireMatter(matterId, workspaceId) {
  const result = await pool.query('SELECT * FROM family_matters WHERE id=$1 AND workspace_id=$2', [matterId, workspaceId]);
  return result.rows[0];
}

router.post('/workspaces', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 3) return res.status(400).json({ error: 'name must contain at least 3 characters' });
  const workspaceId = id(); const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO navigation_workspaces(id,name,created_by) VALUES($1,$2,$3)', [workspaceId, name, req.user.id]);
    await client.query("INSERT INTO navigation_memberships(workspace_id,user_id,role) VALUES($1,$2,'client')", [workspaceId, req.user.id]);
    await audit(client, workspaceId, req.user.id, 'workspace.created', 'workspace', workspaceId);
    await client.query('COMMIT'); res.status(201).json({ id: workspaceId, name, role: 'client' });
  } catch (error) { await client.query('ROLLBACK'); respondError(res, error); } finally { client.release(); }
});

router.post('/workspaces/:workspaceId/members', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['client', 'attorney']);
    const role = String(req.body.role || '');
    if (!['attorney','navigator','viewer'].includes(role) || !Number.isInteger(Number(req.body.userId))) throw new Error('valid userId and invited role are required');
    await pool.query(`INSERT INTO navigation_memberships(workspace_id,user_id,role) VALUES($1,$2,$3)
      ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=EXCLUDED.role`, [workspaceId, req.body.userId, role]);
    res.status(201).json({ workspaceId, userId: Number(req.body.userId), role });
  } catch (error) { respondError(res, error); }
});

router.post('/workspaces/:workspaceId/matters', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['client','attorney','navigator']);
    const { label, countryCode, jurisdictionCode, disclaimerAccepted, safetyNarrative = '' } = req.body;
    if (!label || !/^[A-Z]{2}$/.test(countryCode || '') || !jurisdictionCode || disclaimerAccepted !== true) throw new Error('label, ISO countryCode, jurisdictionCode, and disclaimerAccepted=true are required');
    const safety = screenSafety(safetyNarrative); const matterId = id();
    await pool.query(`INSERT INTO family_matters
      (id,workspace_id,label,country_code,jurisdiction_code,safety_status,disclaimer_accepted_at,created_by)
      VALUES($1,$2,$3,$4,$5,$6,NOW(),$7)`, [matterId, workspaceId, label, countryCode, jurisdictionCode, safety.requiresSafetyEscalation ? 'escalation_requested' : 'no_disclosure', req.user.id]);
    res.status(201).json({ id: matterId, safety, legalAdvice: false, nextStep: safety.requiresSafetyEscalation ? 'Contact an appropriate local safety resource; do not use this app for emergencies.' : 'Collect and confirm facts.' });
  } catch (error) { respondError(res, error); }
});

router.post('/workspaces/:workspaceId/rules', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['attorney','navigator']);
    validateRule(req.body);
    const ruleId = id();
    await pool.query(`INSERT INTO jurisdiction_rules
      (id,workspace_id,jurisdiction_code,rule_key,citation,source_url,effective_from,effective_until,day_count,retrieved_at,content_hash,entered_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [ruleId, workspaceId, req.body.jurisdictionCode, req.body.ruleKey, req.body.citation, req.body.sourceUrl, req.body.effectiveFrom, req.body.effectiveUntil || null, req.body.dayCount ?? null, req.body.retrievedAt || new Date(), req.body.contentHash, req.user.id]);
    res.status(201).json({ id: ruleId, status: 'source_recorded' });
  } catch (error) { respondError(res, error); }
});

router.post('/workspaces/:workspaceId/matters/:matterId/documents', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['client','attorney','navigator']);
    if (!await requireMatter(req.params.matterId, workspaceId)) return res.status(404).json({ error: 'Matter not found' });
    const { documentType, storageRef, sha256, authorizationBasis, sourceDate } = req.body;
    if (!documentType || !storageRef || !/^[a-f0-9]{64}$/i.test(sha256 || '') || String(authorizationBasis || '').trim().length < 8) throw new Error('documentType, storageRef, SHA-256 digest, and authorizationBasis are required');
    const documentId = id();
    await pool.query(`INSERT INTO matter_documents
      (id,matter_id,workspace_id,document_type,storage_ref,sha256,authorization_basis,source_date,uploaded_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [documentId, req.params.matterId, workspaceId, documentType, storageRef, sha256.toLowerCase(), authorizationBasis, sourceDate || null, req.user.id]);
    await pool.query("INSERT INTO navigation_audit_events(workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'document.registered','document',$3,$4)", [workspaceId, req.user.id, documentId, { sha256: sha256.toLowerCase(), matterId: req.params.matterId }]);
    res.status(201).json({ id: documentId, contentAccepted: false, storageRef, sha256: sha256.toLowerCase() });
  } catch (error) { respondError(res, error); }
});

router.put('/workspaces/:workspaceId/matters/:matterId/facts/:factKey', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['client','attorney','navigator']);
    if (!await requireMatter(req.params.matterId, workspaceId)) return res.status(404).json({ error: 'Matter not found' });
    if (req.body.value === undefined) throw new Error('value is required');
    if (req.body.sourceDocumentId) {
      const source = await pool.query('SELECT id FROM matter_documents WHERE id=$1 AND matter_id=$2 AND workspace_id=$3', [req.body.sourceDocumentId, req.params.matterId, workspaceId]);
      if (!source.rows[0]) throw new Error('Source document is not part of this matter');
    }
    const factId = id();
    const result = await pool.query(`INSERT INTO matter_facts
      (id,matter_id,workspace_id,fact_key,fact_value,source_document_id,confirmed_by_client,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(matter_id,fact_key) DO UPDATE SET fact_value=EXCLUDED.fact_value,source_document_id=EXCLUDED.source_document_id,
      confirmed_by_client=EXCLUDED.confirmed_by_client,created_by=EXCLUDED.created_by RETURNING *`,
    [factId, req.params.matterId, workspaceId, req.params.factKey, req.body.value, req.body.sourceDocumentId || null, req.body.confirmedByClient === true, req.user.id]);
    await pool.query("INSERT INTO navigation_audit_events(workspace_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'fact.recorded','matter_fact',$3,$4)", [workspaceId, req.user.id, result.rows[0].id, { matterId: req.params.matterId, factKey: req.params.factKey }]);
    res.json(result.rows[0]);
  } catch (error) { respondError(res, error); }
});

router.post('/workspaces/:workspaceId/matters/:matterId/deadlines', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['attorney','navigator']);
    const ruleResult = await pool.query(`SELECT * FROM jurisdiction_rules WHERE id=$1 AND workspace_id=$2`, [req.body.ruleId, workspaceId]);
    const rule = ruleResult.rows[0]; if (!rule) return res.status(404).json({ error: 'Sourced rule not found' });
    const matterResult = await pool.query('SELECT jurisdiction_code FROM family_matters WHERE id=$1 AND workspace_id=$2', [req.params.matterId, workspaceId]);
    if (!matterResult.rows[0]) return res.status(404).json({ error: 'Matter not found' });
    if (matterResult.rows[0].jurisdiction_code !== rule.jurisdiction_code) throw new Error('Rule jurisdiction does not match matter jurisdiction');
    const calculation = calculateCalendarDeadline({ triggerDate: req.body.triggerDate, dayCount: rule.day_count, rule: { citation: rule.citation, sourceUrl: rule.source_url, effectiveFrom: rule.effective_from, effectiveUntil: rule.effective_until } });
    const deadlineId = id();
    await pool.query(`INSERT INTO matter_deadlines(id,matter_id,workspace_id,rule_id,trigger_date,due_date,calculation_method,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [deadlineId, req.params.matterId, workspaceId, rule.id, req.body.triggerDate, calculation.dueDate, calculation.calculationMethod, req.user.id]);
    res.status(201).json({ id: deadlineId, ...calculation, citation: rule.citation, sourceUrl: rule.source_url });
  } catch (error) { respondError(res, error); }
});

router.post('/workspaces/:workspaceId/matters/:matterId/options', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['attorney','navigator']);
    if (!await requireMatter(req.params.matterId, workspaceId)) return res.status(404).json({ error: 'Matter not found' });
    if (!req.body.title || !req.body.plainLanguage || !Array.isArray(req.body.sourceRuleIds) || !req.body.sourceRuleIds.length) throw new Error('title, plainLanguage, and sourceRuleIds are required');
    const sources = await pool.query('SELECT id FROM jurisdiction_rules WHERE workspace_id=$1 AND id=ANY($2::uuid[])', [workspaceId, req.body.sourceRuleIds]);
    if (sources.rows.length !== new Set(req.body.sourceRuleIds).size) throw new Error('Every explanation must cite an authorized workspace rule');
    const optionId = id();
    await pool.query(`INSERT INTO option_explanations
      (id,matter_id,workspace_id,title,plain_language,source_rule_ids,professional_disclaimer,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [optionId, req.params.matterId, workspaceId, req.body.title, req.body.plainLanguage, req.body.sourceRuleIds, 'General legal information only; not legal advice or representation. Attorney review is required.', req.user.id]);
    res.status(201).json({ id: optionId, status: 'draft', attorneyReviewRequired: true });
  } catch (error) { respondError(res, error); }
});

router.post('/workspaces/:workspaceId/options/:optionId/review', async (req, res) => {
  try {
    const { workspaceId } = await member(req, ['attorney']);
    if (!['attorney_reviewed','rejected'].includes(req.body.decision) || String(req.body.note || '').trim().length < 8) throw new Error('decision and a meaningful review note are required');
    const result = await pool.query(`UPDATE option_explanations SET status=$1,reviewed_by=$2,review_note=$3
      WHERE id=$4 AND workspace_id=$5 AND status='draft' RETURNING id,status`, [req.body.decision, req.user.id, req.body.note, req.params.optionId, workspaceId]);
    if (!result.rows[0]) return res.status(409).json({ error: 'Option is missing or already reviewed' });
    res.json(result.rows[0]);
  } catch (error) { respondError(res, error); }
});

router.get('/workspaces/:workspaceId/matters/:matterId/summary', async (req, res) => {
  try {
    const { workspaceId } = await member(req);
    const [matter, deadlines, options] = await Promise.all([
      pool.query('SELECT * FROM family_matters WHERE id=$1 AND workspace_id=$2', [req.params.matterId, workspaceId]),
      pool.query(`SELECT d.*,r.citation,r.source_url FROM matter_deadlines d JOIN jurisdiction_rules r ON r.id=d.rule_id WHERE d.matter_id=$1 AND d.workspace_id=$2 ORDER BY due_date`, [req.params.matterId, workspaceId]),
      pool.query('SELECT * FROM option_explanations WHERE matter_id=$1 AND workspace_id=$2 ORDER BY created_at', [req.params.matterId, workspaceId]),
    ]);
    if (!matter.rows[0]) return res.status(404).json({ error: 'Matter not found' });
    res.json({ matter: matter.rows[0], deadlines: deadlines.rows, options: options.rows, legalAdvice: false, generatedAt: new Date().toISOString() });
  } catch (error) { respondError(res, error); }
});

export default router;
