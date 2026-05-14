import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const TABLE = 'custody_cases';
const AI_SYSTEM_PROMPT = 'You are an expert family law attorney specializing in child custody. Analyze this custody situation and provide: 1) Best interests of the child analysis, 2) Recommended custody arrangement, 3) Visitation schedule suggestions, 4) Factors that may influence court decisions, 5) Tips for co-parenting success. Be compassionate and child-focused.';
const aiFieldFn = (item) => `Child Name: ${item.child_name}\nChild Age: ${item.child_age}\nCurrent Arrangement: ${item.current_arrangement}\nDesired Arrangement: ${item.desired_arrangement}\nSpecial Needs: ${item.special_needs || 'None'}\nParent Situation: ${item.parent_situation}\nNotes: ${item.notes || 'N/A'}`;

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
    const { child_name, child_age, current_arrangement, desired_arrangement, parent_situation } = req.body;

    if (!child_name || typeof child_name !== 'string' || child_name.trim().length === 0) {
      return res.status(400).json({ error: 'child_name is required' });
    }
    if (!current_arrangement || typeof current_arrangement !== 'string' || current_arrangement.trim().length === 0) {
      return res.status(400).json({ error: 'current_arrangement is required' });
    }
    if (!desired_arrangement || typeof desired_arrangement !== 'string' || desired_arrangement.trim().length === 0) {
      return res.status(400).json({ error: 'desired_arrangement is required' });
    }
    if (!parent_situation || typeof parent_situation !== 'string' || parent_situation.trim().length === 0) {
      return res.status(400).json({ error: 'parent_situation is required' });
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
