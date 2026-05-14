import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// GET /api/court-dates/upcoming - next 30 days, sorted by date (must be before /:id routes)
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT * FROM court_dates
       WHERE user_id = $1
         AND date >= $2
         AND date <= $3
       ORDER BY date ASC`,
      [req.user.id, now.toISOString(), thirtyDaysLater.toISOString()]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/court-dates - list with pagination, optional ?upcoming=true filter
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const upcoming = req.query.upcoming === 'true';

    let whereClause = 'WHERE user_id = $1';
    const params = [req.user.id];

    if (upcoming) {
      params.push(new Date().toISOString());
      whereClause += ` AND date >= $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM court_dates ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM court_dates ${whereClause} ORDER BY date ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/court-dates - create with validation
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, case_type, case_id, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'date must be a valid date' });
    }

    const result = await pool.query(
      `INSERT INTO court_dates (user_id, title, date, case_type, case_id, description, reminder_sent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) RETURNING *`,
      [req.user.id, title.trim(), parsedDate.toISOString(), case_type || null, case_id || null, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/court-dates/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, date, case_type, case_id, description, reminder_sent } = req.body;

    // Validate date if provided
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'date must be a valid date' });
      }
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (date !== undefined) data.date = new Date(date).toISOString();
    if (case_type !== undefined) data.case_type = case_type;
    if (case_id !== undefined) data.case_id = case_id;
    if (description !== undefined) data.description = description;
    if (reminder_sent !== undefined) data.reminder_sent = reminder_sent;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE court_dates SET ${setClause} WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
      [...values, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/court-dates/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM court_dates WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/court-dates/:id - single
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM court_dates WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
