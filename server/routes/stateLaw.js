import { Router } from 'express';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { parseAIJson } from '../utils/parseAIJson.js';

const router = Router();

const STATE_DEFAULTS = [
  { state_code: 'CA', property_regime: 'community', mandatory_waiting_period_days: 180, residency_requirement_months: 6, notes: '6 months CA, 3 months in county.', source: 'CA Family Code §2320' },
  { state_code: 'TX', property_regime: 'community', mandatory_waiting_period_days: 60, residency_requirement_months: 6, notes: '6 months TX, 90 days in county.', source: 'TX Family Code §6.301' },
  { state_code: 'NY', property_regime: 'equitable', mandatory_waiting_period_days: 0, residency_requirement_months: 12, notes: '1 year residency for most grounds.', source: 'NY DRL §230' },
  { state_code: 'FL', property_regime: 'equitable', mandatory_waiting_period_days: 20, residency_requirement_months: 6, notes: '6 months FL.', source: 'FL Stat §61.021' },
  { state_code: 'IL', property_regime: 'equitable', mandatory_waiting_period_days: 0, residency_requirement_months: 3, notes: '90 days IL.', source: '750 ILCS 5/401' },
  { state_code: 'WA', property_regime: 'community', mandatory_waiting_period_days: 90, residency_requirement_months: 0, notes: 'No residency duration; just current resident.', source: 'RCW 26.09.030' },
  { state_code: 'AZ', property_regime: 'community', mandatory_waiting_period_days: 60, residency_requirement_months: 3, notes: '90 days AZ.', source: 'A.R.S. §25-312' },
  { state_code: 'NV', property_regime: 'community', mandatory_waiting_period_days: 0, residency_requirement_months: 1.5, notes: '6 weeks NV.', source: 'NRS 125.020' },
];

/**
 * GET /api/state-law — list all known state legal facts (paginated; defaults seeded if empty)
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM state_legal_facts');
    let total = parseInt(countResult.rows[0].count);

    if (total === 0) {
      // First-run seeding
      for (const f of STATE_DEFAULTS) {
        await pool.query(
          `INSERT INTO state_legal_facts (state_code, property_regime, mandatory_waiting_period_days, residency_requirement_months, notes, source)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (state_code) DO NOTHING`,
          [f.state_code, f.property_regime, f.mandatory_waiting_period_days, f.residency_requirement_months, f.notes, f.source]
        );
      }
      total = STATE_DEFAULTS.length;
    }

    const result = await pool.query(
      'SELECT * FROM state_legal_facts ORDER BY state_code ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * GET /api/state-law/:state_code — fetch single state fact
 */
router.get('/:state_code', auth, async (req, res) => {
  try {
    const code = String(req.params.state_code).toUpperCase().substring(0, 2);
    const r = await pool.query('SELECT * FROM state_legal_facts WHERE state_code = $1', [code]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'State not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/state-law/advise — AI guidance enriched with state-specific facts
 * Body: { state, situation }
 */
router.post('/advise', auth, aiRateLimiter, async (req, res) => {
  try {
    const { state, situation } = req.body;
    if (!state || !situation) return res.status(400).json({ error: 'state and situation are required' });

    const code = String(state).toUpperCase().substring(0, 2);
    const factRes = await pool.query('SELECT * FROM state_legal_facts WHERE state_code = $1', [code]);
    const fact = factRes.rows[0] || null;

    const systemPrompt = `You are an expert family law attorney AI advisor for ${code}.
Use the provided STATE FACTS verbatim where applicable. Always remind the user this is informational, not legal advice.
Return ONLY JSON:
{
  "applicable_state_rules": ["string"],
  "advice": "string",
  "next_steps": ["string"],
  "watchouts": ["string"],
  "disclaimer": "string"
}`;

    const userPrompt = `STATE FACTS for ${code}:
${fact ? JSON.stringify(fact) : 'No cached facts; reason from your training.'}

USER SITUATION:
${situation}`;

    const ai = await queryAI(systemPrompt, userPrompt);
    const { parsed } = parseAIJson(ai);

    res.json({ state: code, fact, ai_analysis: ai, ai_results: parsed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
