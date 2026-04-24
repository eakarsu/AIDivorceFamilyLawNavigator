import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';

export function createCrudRoutes(tableName, aiSystemPrompt, aiFieldFn) {
  const router = Router();

  // Get all items
  router.get('/', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
      res.json(result.rows);
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
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
      const data = req.body;
      delete data.id;
      delete data.user_id;
      delete data.created_at;
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
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

  // AI Analyze
  router.post('/:id/analyze', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const item = result.rows[0];
      const userPrompt = aiFieldFn(item);
      const aiResponse = await queryAI(aiSystemPrompt, userPrompt);
      await pool.query(`UPDATE ${tableName} SET ai_analysis = $1, updated_at = NOW() WHERE id = $2`, [aiResponse, req.params.id]);
      res.json({ ai_analysis: aiResponse });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
