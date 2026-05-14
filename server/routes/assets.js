import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const TABLE = 'marital_assets';
const AI_SYSTEM_PROMPT = 'You are an expert family law attorney specializing in asset division. Analyze this marital asset and provide: 1) Fair market value assessment considerations, 2) Classification as marital vs separate property, 3) Recommended division approach, 4) Tax implications to consider, 5) Key factors that may affect division. Format professionally with headers.';
const aiFieldFn = (item) => `Asset: ${item.name}\nType: ${item.asset_type}\nEstimated Value: $${item.estimated_value}\nOwnership: ${item.ownership}\nAcquired: ${item.acquisition_date || 'N/A'}\nDescription: ${item.description}\nNotes: ${item.notes || 'N/A'}`;

// GET all - with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM ${TABLE} WHERE user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT * FROM ${TABLE} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - with input validation
router.post('/', auth, async (req, res) => {
  try {
    const { name, asset_type, estimated_value, ownership, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!asset_type || typeof asset_type !== 'string' || asset_type.trim().length === 0) {
      return res.status(400).json({ error: 'asset_type is required' });
    }
    if (estimated_value === undefined || estimated_value === null || isNaN(Number(estimated_value))) {
      return res.status(400).json({ error: 'estimated_value is required and must be a number' });
    }
    if (!ownership || typeof ownership !== 'string' || ownership.trim().length === 0) {
      return res.status(400).json({ error: 'ownership is required' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'description is required' });
    }

    const data = { ...req.body, user_id: req.user.id };
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO ${TABLE} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.user_id;
    delete data.created_at;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE ${TABLE} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
      [...values, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1 AND user_id = $2 RETURNING *`, [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analyze
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = result.rows[0];
    const userPrompt = aiFieldFn(item);
    const aiResponse = await queryAI(AI_SYSTEM_PROMPT, userPrompt);
    await pool.query(`UPDATE ${TABLE} SET ai_analysis = $1, updated_at = NOW() WHERE id = $2`, [aiResponse, req.params.id]);
    res.json({ ai_analysis: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
