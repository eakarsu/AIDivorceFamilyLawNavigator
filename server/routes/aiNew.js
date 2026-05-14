import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import pool from '../config/db.js';

const router = Router();

/**
 * POST /api/ai/document-upload-analyze
 * Accepts: { document_text, document_type }
 * Uses AI document-review mode to analyze the uploaded text
 */
router.post('/document-upload-analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const { document_text, document_type } = req.body;

    if (!document_text || typeof document_text !== 'string' || document_text.trim().length === 0) {
      return res.status(400).json({ error: 'document_text is required' });
    }
    if (!document_type || typeof document_type !== 'string' || document_type.trim().length === 0) {
      return res.status(400).json({ error: 'document_type is required' });
    }

    const systemPrompt = `You are an expert legal document analyst specializing in family law. You are reviewing a ${document_type} document.
Analyze it thoroughly and provide:
1. Executive Summary - key purpose and parties
2. Critical Terms & Provisions - important clauses explained in plain language
3. Risk Assessment - potential risks or unfavorable terms
4. Missing Elements - what should be in this type of document but is absent
5. Action Items - specific steps the reader should take
6. Recommendations - suggested modifications or negotiation points

Format with clear headers. Be specific and practical.`;

    const userPrompt = `Please analyze this ${document_type} document:\n\n${document_text}`;

    const findings = await queryAI(systemPrompt, userPrompt);

    res.json({
      document_type,
      findings,
      analyzed_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/multi-turn-advisor
 * Accepts: { case_id, messages: [{role, content}], new_message }
 * Maintains conversation history context across turns
 */
router.post('/multi-turn-advisor', auth, aiRateLimiter, async (req, res) => {
  try {
    const { case_id, messages, new_message } = req.body;

    if (!new_message || typeof new_message !== 'string' || new_message.trim().length === 0) {
      return res.status(400).json({ error: 'new_message is required' });
    }

    // Validate messages array
    const conversationHistory = Array.isArray(messages) ? messages : [];

    // Fetch case context if case_id provided
    let caseContext = '';
    if (case_id) {
      try {
        // Try to find context across common tables
        const tables = ['custody_cases', 'marital_assets', 'legal_documents', 'settlement_agreements'];
        for (const table of tables) {
          const result = await pool.query(
            `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2 LIMIT 1`,
            [case_id, req.user.id]
          );
          if (result.rows.length > 0) {
            caseContext = `\n\nCase Context (${table}): ${JSON.stringify(result.rows[0])}`;
            break;
          }
        }
      } catch (_) {
        // Case lookup failure is non-fatal
      }
    }

    const systemPrompt = `You are an expert family law attorney AI advisor providing ongoing legal guidance.
You maintain context across the conversation to give consistent, personalized advice.
Always be empathetic, thorough, and recommend consulting a licensed attorney for specific legal decisions.${caseContext}`;

    // Build the multi-turn messages array for OpenRouter
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.filter(m => m.role && m.content).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content),
      })),
      { role: 'user', content: new_message },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Divorce & Family Law Navigator',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: allMessages,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter API error');
    }

    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated.';

    res.json({
      response: aiResponse,
      case_id: case_id || null,
      messages: [
        ...conversationHistory,
        { role: 'user', content: new_message },
        { role: 'assistant', content: aiResponse },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/timeline-estimator
 * Accepts: { state, case_type, contested (bool) }
 * Generates realistic timeline with milestone dates
 */
router.post('/timeline-estimator', auth, aiRateLimiter, async (req, res) => {
  try {
    const { state, case_type, contested } = req.body;

    if (!state || typeof state !== 'string' || state.trim().length === 0) {
      return res.status(400).json({ error: 'state is required' });
    }
    if (!case_type || typeof case_type !== 'string' || case_type.trim().length === 0) {
      return res.status(400).json({ error: 'case_type is required' });
    }

    const isContested = contested === true || contested === 'true';
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are an expert family law process consultant with deep knowledge of divorce proceedings across all US states.
Generate a detailed, realistic divorce timeline with specific milestone dates.
Return your response as a JSON object with this exact structure:
{
  "estimated_total_months": number,
  "complexity": "simple" | "moderate" | "complex",
  "milestones": [
    {
      "phase": "phase name",
      "title": "milestone title",
      "estimated_date": "YYYY-MM-DD",
      "description": "what happens at this stage",
      "tips": "practical advice for this phase"
    }
  ],
  "key_factors": ["factor affecting timeline"],
  "cost_estimate": {
    "low": number,
    "high": number,
    "currency": "USD"
  },
  "disclaimer": "string"
}`;

    const userPrompt = `Generate a realistic divorce timeline starting from today (${today}) for:
- State: ${state}
- Case Type: ${case_type}
- Contested: ${isContested ? 'Yes' : 'No'}

Include all major milestones from filing to finalization based on ${state} state-specific requirements and typical court timelines.`;

    const rawResponse = await queryAI(systemPrompt, userPrompt);

    // Try to parse as JSON, fall back to raw text
    let timeline;
    try {
      // Extract JSON from the response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        timeline = JSON.parse(jsonMatch[0]);
      } else {
        timeline = { raw: rawResponse };
      }
    } catch (_) {
      timeline = { raw: rawResponse };
    }

    res.json({
      state,
      case_type,
      contested: isContested,
      generated_at: new Date().toISOString(),
      timeline,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/predict-trial-outcome
 * Accepts: { case_facts, jurisdiction, parties, claims }
 * Returns probabilistic forecast with reasoning.
 */
router.post('/predict-trial-outcome', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
    }
    const { case_facts, jurisdiction, parties, claims } = req.body || {};
    if (!case_facts || typeof case_facts !== 'string' || !case_facts.trim()) {
      return res.status(400).json({ error: 'case_facts is required' });
    }

    const systemPrompt = `You are an expert family law trial outcome predictor. Provide a probabilistic forecast with explicit reasoning.
Return JSON with this exact shape:
{
  "outcome_probabilities": [{ "outcome": "string", "probability": 0-1, "reasoning": "string" }],
  "key_drivers": ["string"],
  "weakness_factors": ["string"],
  "recommended_strategy": "string",
  "confidence_level": "low|medium|high",
  "disclaimer": "string"
}`;
    const userPrompt = `Predict the trial outcome based on:
- Jurisdiction: ${jurisdiction || 'unspecified'}
- Parties: ${parties || 'unspecified'}
- Claims: ${claims || 'unspecified'}
- Case facts:\n${case_facts}`;

    const raw = await queryAI(systemPrompt, userPrompt);
    let prediction;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      prediction = m ? JSON.parse(m[0]) : { raw };
    } catch (_) {
      prediction = { raw };
    }
    res.json({ generated_at: new Date().toISOString(), prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/predict-custody-outcome
 * Accepts: { case_id?, custody_facts, jurisdiction, child_factors }
 * Pulls case facts from custody_cases when case_id present.
 */
router.post('/predict-custody-outcome', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
    }
    const { case_id, custody_facts, jurisdiction, child_factors } = req.body || {};

    let caseRow = null;
    if (case_id) {
      try {
        const result = await pool.query(
          `SELECT * FROM custody_cases WHERE id = $1 AND user_id = $2 LIMIT 1`,
          [case_id, req.user.id]
        );
        caseRow = result.rows[0] || null;
      } catch (_) {}
    }

    if (!caseRow && (!custody_facts || !String(custody_facts).trim())) {
      return res.status(400).json({ error: 'custody_facts or valid case_id is required' });
    }

    const systemPrompt = `You are an expert custody outcome predictor. Provide a probabilistic forecast with reasoning grounded in best-interest-of-the-child standards.
Return JSON:
{
  "predicted_arrangement": "string",
  "primary_custody_likelihood": { "parent_a": 0-1, "parent_b": 0-1, "joint": 0-1 },
  "key_factors": [{ "factor": "string", "weight": "low|medium|high", "rationale": "string" }],
  "risk_flags": ["string"],
  "recommendations": ["string"],
  "confidence_level": "low|medium|high",
  "disclaimer": "string"
}`;
    const userPrompt = `Predict custody outcome:
- Jurisdiction: ${jurisdiction || 'unspecified'}
- Child factors: ${child_factors || 'unspecified'}
- Case facts: ${custody_facts || 'derived from case'}
${caseRow ? `\n- Stored case: ${JSON.stringify(caseRow)}` : ''}`;

    const raw = await queryAI(systemPrompt, userPrompt);
    let prediction;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      prediction = m ? JSON.parse(m[0]) : { raw };
    } catch (_) {
      prediction = { raw };
    }
    res.json({ generated_at: new Date().toISOString(), case_id: case_id || null, prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/draft-documents
 * Accepts: { document_type, parties, jurisdiction, facts }
 */
router.post('/draft-documents', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
    }
    const { document_type, parties, jurisdiction, facts } = req.body || {};
    if (!document_type || typeof document_type !== 'string' || !document_type.trim()) {
      return res.status(400).json({ error: 'document_type is required' });
    }

    const systemPrompt = `You are an expert family law drafter. Produce a clear, well-structured draft of the requested document.
Use proper section headings, definitions, and signature/notarization blocks where appropriate.
End with a clearly labeled "Disclaimer" section noting the draft must be reviewed by a licensed attorney.`;
    const userPrompt = `Draft a ${document_type} for jurisdiction ${jurisdiction || 'unspecified'}.
Parties: ${parties || 'unspecified'}
Relevant facts: ${facts || 'none provided'}`;

    const draft = await queryAI(systemPrompt, userPrompt);
    res.json({
      document_type,
      jurisdiction: jurisdiction || null,
      generated_at: new Date().toISOString(),
      draft,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Apply pass 5 additions -----

/**
 * POST /api/ai/state-aware-guidance
 * Accepts: { state, topic, facts }
 * NEEDS-PRODUCT-DECISION: We do NOT ship a curated 50-state legal rules dataset
 * (that requires authoritative legal-publisher data). Instead we use the LLM
 * to summarize commonly-cited factors per state and clearly disclaim that the
 * output is informational and not legal advice. Default jurisdiction: 'GENERAL'
 * if unspecified.
 * PRODUCT-DECISION: default jurisdiction = 'GENERAL'; topics whitelist =
 * ['child-support','alimony','custody','property','divorce-process'].
 */
router.post('/state-aware-guidance', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured', missing: 'OPENROUTER_API_KEY' });
    }
    const { state, topic, facts } = req.body || {};
    const ALLOWED_TOPICS = ['child-support', 'alimony', 'custody', 'property', 'divorce-process'];
    const safeTopic = ALLOWED_TOPICS.includes(topic) ? topic : 'divorce-process';
    const safeState = (typeof state === 'string' && state.trim()) ? state.trim().slice(0, 64) : 'GENERAL';

    const systemPrompt = `You are an expert family-law researcher. For the given U.S. state and topic, produce JSON:
{
  "state": "string",
  "topic": "string",
  "key_statutes": [{ "name": "string", "citation": "string", "summary": "string" }],
  "calculation_factors": ["string"],
  "common_outcomes": ["string"],
  "deadlines_and_filings": ["string"],
  "practical_tips": ["string"],
  "confidence": "low|medium|high",
  "disclaimer": "string"
}
Mark confidence honestly; flag when authoritative confirmation is required.`;
    const userPrompt = `State: ${safeState}\nTopic: ${safeTopic}\nUser facts:\n${facts || 'no facts provided'}`;

    const raw = await queryAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw };
    } catch (_) {
      parsed = { raw };
    }
    res.json({ state: safeState, topic: safeTopic, generated_at: new Date().toISOString(), guidance: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/legal-research-search
 * NEEDS-CREDS: requires LexisNexis or Westlaw API credentials.
 * ENV VARS: LEXIS_API_KEY (or WESTLAW_API_KEY)
 * Returns 503 + { missing } when neither key is present.
 */
router.post('/legal-research-search', auth, aiRateLimiter, async (req, res) => {
  if (!process.env.LEXIS_API_KEY && !process.env.WESTLAW_API_KEY) {
    return res.status(503).json({
      error: 'Legal research provider not configured',
      missing: 'LEXIS_API_KEY or WESTLAW_API_KEY',
    });
  }
  // PRODUCT-DECISION: when keys are present we still return a stub today;
  // this endpoint is wired so the FE shows the gated state correctly.
  res.json({
    provider: process.env.LEXIS_API_KEY ? 'lexisnexis' : 'westlaw',
    note: 'Provider integration stubbed — credentials are configured but the live API call is not yet wired.',
    query: req.body?.query || null,
    results: [],
  });
});

/**
 * POST /api/ai/esign-request
 * NEEDS-CREDS: requires DocuSign or HelloSign credentials.
 * ENV VARS: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID
 * Returns 503 + { missing } when keys are absent.
 */
router.post('/esign-request', auth, aiRateLimiter, async (req, res) => {
  const required = ['DOCUSIGN_INTEGRATION_KEY', 'DOCUSIGN_USER_ID', 'DOCUSIGN_ACCOUNT_ID'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return res.status(503).json({ error: 'E-signature provider not configured', missing: missing.join(',') });
  }
  // PRODUCT-DECISION: stubbed envelope creation; live SDK call not wired here.
  res.json({
    provider: 'docusign',
    note: 'E-sign envelope creation stubbed — credentials present but live API call not yet wired.',
    document_id: req.body?.document_id || null,
    status: 'pending',
  });
});

/**
 * POST /api/ai/court-filing-submit
 * NEEDS-CREDS: requires per-jurisdiction PACER / state e-file credentials.
 * ENV VARS: COURT_EFILE_API_KEY
 * Returns 503 + { missing } when key is absent.
 */
router.post('/court-filing-submit', auth, aiRateLimiter, async (req, res) => {
  if (!process.env.COURT_EFILE_API_KEY) {
    return res.status(503).json({
      error: 'Court e-filing provider not configured',
      missing: 'COURT_EFILE_API_KEY',
    });
  }
  // PRODUCT-DECISION: stubbed because each jurisdiction requires bespoke wiring.
  res.json({
    note: 'Court e-filing stubbed — credentials present but per-jurisdiction integration not yet wired.',
    document_id: req.body?.document_id || null,
    jurisdiction: req.body?.jurisdiction || null,
    status: 'queued',
  });
});

/**
 * POST /api/ai/coparenting-message-coach
 * MECHANICAL: AI-powered tone/clarity rewrite for co-parenting communication.
 */
router.post('/coparenting-message-coach', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured', missing: 'OPENROUTER_API_KEY' });
    }
    const { draft, audience, tone } = req.body || {};
    if (!draft || typeof draft !== 'string' || !draft.trim()) {
      return res.status(400).json({ error: 'draft is required' });
    }
    const systemPrompt = `You are a co-parenting communication coach. Rewrite the draft to be neutral, child-focused, and conflict-de-escalating.
Return JSON:
{
  "rewritten_message": "string",
  "tone_assessment_original": "string",
  "tone_assessment_rewritten": "string",
  "removed_triggers": ["string"],
  "added_clarity": ["string"],
  "suggested_followup_questions": ["string"]
}`;
    const userPrompt = `Audience: ${audience || 'co-parent'}\nDesired tone: ${tone || 'neutral, calm, child-focused'}\nDraft message:\n${draft}`;
    const raw = await queryAI(systemPrompt, userPrompt);
    let parsed;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw };
    } catch (_) {
      parsed = { raw };
    }
    res.json({ generated_at: new Date().toISOString(), coaching: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
