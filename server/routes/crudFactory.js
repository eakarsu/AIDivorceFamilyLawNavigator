import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { parseAIJson } from '../utils/parseAIJson.js';

// Hardened allowlist of valid table names; anything else throws on registration.
export const ALLOWED_TABLES = new Set([
  'legal_documents',
  'marital_assets',
  'custody_cases',
  'alimony_cases',
  'generated_documents',
  'mediation_sessions',
  'court_filings',
  'financial_disclosures',
  'parenting_plans',
  'property_valuations',
  'legal_rights',
  'settlement_agreements',
  'child_support_cases',
  'divorce_timelines',
  'legal_glossary',
]);

// Sanitize column identifiers by allowlisting only [a-z0-9_] keys.
const isSafeIdent = (s) => typeof s === 'string' && /^[a-z][a-z0-9_]*$/.test(s) && s.length <= 64;

export function createCrudRoutes(tableName, aiSystemPrompt, aiFieldFn) {
  if (!ALLOWED_TABLES.has(tableName)) {
    throw new Error(`crudFactory: table "${tableName}" is not in the allowlist.`);
  }
  const router = Router();

  // Get all items - paginated with backward-compat array shape via ?legacy=true
  router.get('/', auth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName} WHERE user_id = $1`, [req.user.id]);
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );

      if (req.query.legacy === 'true') return res.json(result.rows);
      // Default: legacy shape (array) to preserve existing client behavior; pagination is exposed via headers.
      res.set('X-Total-Count', String(total));
      res.set('X-Page', String(page));
      res.set('X-Total-Pages', String(totalPages));
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Paginated structured shape
  router.get('/page', auth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName} WHERE user_id = $1`, [req.user.id]);
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );
      res.json({ data: result.rows, pagination: { page, limit, total, totalPages } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single item
  router.get('/:id', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create item
  router.post('/', auth, async (req, res) => {
    try {
      const data = { ...req.body, user_id: req.user.id };
      delete data.id; delete data.created_at; delete data.updated_at;
      const safeKeys = Object.keys(data).filter(isSafeIdent);
      if (safeKeys.length === 0) return res.status(400).json({ error: 'No valid fields to insert' });
      const values = safeKeys.map((k) => data[k]);
      const placeholders = safeKeys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${tableName} (${safeKeys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update item
  router.put('/:id', auth, async (req, res) => {
    try {
      const data = { ...req.body };
      delete data.id; delete data.user_id; delete data.created_at;
      const safeKeys = Object.keys(data).filter(isSafeIdent);
      if (safeKeys.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
      const values = safeKeys.map((k) => data[k]);
      const setClause = safeKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${safeKeys.length + 1} AND user_id = $${safeKeys.length + 2} RETURNING *`,
        [...values, req.params.id, req.user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete item
  router.delete('/:id', auth, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 AND user_id = $2 RETURNING *`, [req.params.id, req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI Analyze - rate-limited; persists ai_analysis (text) + ai_results (parsed JSONB)
  router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const item = result.rows[0];
      const userPrompt = aiFieldFn(item);
      const aiResponse = await queryAI(aiSystemPrompt, userPrompt);
      const { parsed } = parseAIJson(aiResponse);
      await pool.query(
        `UPDATE ${tableName} SET ai_analysis = $1, ai_results = $2, updated_at = NOW() WHERE id = $3`,
        [aiResponse, parsed, req.params.id]
      );
      res.json({ ai_analysis: aiResponse, ai_results: parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
