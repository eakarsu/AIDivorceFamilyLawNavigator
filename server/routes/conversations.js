import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * GET /api/conversations - list (paginated)
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const c = await pool.query('SELECT COUNT(*) FROM case_conversations WHERE user_id = $1', [req.user.id]);
    const total = parseInt(c.rows[0].count);

    const r = await pool.query(
      'SELECT id, title, case_table, case_id, created_at, updated_at, jsonb_array_length(messages) AS message_count FROM case_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: r.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * GET /api/conversations/:id - full thread
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM case_conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/conversations - create new thread { title, case_table, case_id }
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, case_table, case_id } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const r = await pool.query(
      'INSERT INTO case_conversations (user_id, title, case_table, case_id, messages) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *',
      [req.user.id, title, case_table || null, case_id || null, JSON.stringify([])]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/conversations/:id/message - { content }
 * Appends user message, calls AI with full history, appends assistant message.
 */
router.post('/:id/message', auth, aiRateLimiter, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') return res.status(400).json({ error: 'content required' });

    const r = await pool.query('SELECT * FROM case_conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const conv = r.rows[0];
    const messages = Array.isArray(conv.messages) ? conv.messages : [];

    // Optional case context
    let caseContext = '';
    if (conv.case_table && conv.case_id) {
      // case_table is constrained to allowlist used in crudFactory; inline check
      const allowed = ['legal_documents','marital_assets','custody_cases','alimony_cases','generated_documents','mediation_sessions','court_filings','financial_disclosures','parenting_plans','property_valuations','legal_rights','settlement_agreements','child_support_cases','divorce_timelines','legal_glossary'];
      if (allowed.includes(conv.case_table)) {
        try {
          const c = await pool.query(`SELECT * FROM ${conv.case_table} WHERE id = $1 AND user_id = $2 LIMIT 1`, [conv.case_id, req.user.id]);
          if (c.rows.length > 0) caseContext = `\nCASE CONTEXT (${conv.case_table}): ${JSON.stringify(c.rows[0]).substring(0, 2000)}`;
        } catch (_) {}
      }
    }

    const systemPrompt = `You are an expert family law AI advisor maintaining a long-running conversation with the same user.
Be empathetic, accurate, and always recommend a licensed attorney for binding decisions.${caseContext}`;

    const allMsgs = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) })),
      { role: 'user', content },
    ];

    const apiResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Divorce & Family Law Navigator',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: allMsgs,
        max_tokens: 2000,
      }),
    });
    const data = await apiResponse.json();
    if (data.error) throw new Error(data.error.message || 'OpenRouter error');
    const reply = data.choices?.[0]?.message?.content || 'No response.';

    const newMessages = [
      ...messages,
      { role: 'user', content, at: new Date().toISOString() },
      { role: 'assistant', content: reply, at: new Date().toISOString() },
    ];

    const updated = await pool.query(
      'UPDATE case_conversations SET messages = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(newMessages), conv.id]
    );

    res.json({ conversation: updated.rows[0], reply });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * DELETE /api/conversations/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM case_conversations WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
