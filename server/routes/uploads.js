import { Router } from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { parseAIJson } from '../utils/parseAIJson.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Lazy-load pdf-parse (CommonJS) to avoid ESM hiccups when not used
async function extractTextFromPdf(buffer) {
  try {
    const mod = await import('pdf-parse');
    const pdfParse = mod.default || mod;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (e) {
    console.warn('pdf-parse failed:', e.message);
    return '';
  }
}

/**
 * GET /api/uploads — list user's uploaded docs (paginated)
 */
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM uploaded_documents WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT id, filename, document_type, size_bytes, mime_type, ai_analysis, ai_results, created_at FROM uploaded_documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/uploads/:id - includes text content
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM uploaded_documents WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/uploads — upload PDF/text/docx-text. Field name: "file". Optional body: document_type.
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required (multipart "file" field).' });

    const mime = req.file.mimetype || 'application/octet-stream';
    let text = '';
    if (mime === 'application/pdf' || /\.pdf$/i.test(req.file.originalname)) {
      text = await extractTextFromPdf(req.file.buffer);
    } else if (mime.startsWith('text/') || /\.(txt|md|json)$/i.test(req.file.originalname)) {
      text = req.file.buffer.toString('utf-8');
    } else {
      // Best-effort: treat as text
      text = req.file.buffer.toString('utf-8');
    }

    const inserted = await pool.query(
      `INSERT INTO uploaded_documents (user_id, filename, document_type, size_bytes, mime_type, text_content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, filename, document_type, size_bytes, mime_type, created_at`,
      [req.user.id, req.file.originalname, req.body?.document_type || null, req.file.size, mime, text]
    );

    res.status(201).json({ ...inserted.rows[0], text_chars: text.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/uploads/:id/analyze — AI document review on the uploaded text content
 */
router.post('/:id/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM uploaded_documents WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const doc = r.rows[0];
    if (!doc.text_content || doc.text_content.length === 0) {
      return res.status(400).json({ error: 'No extractable text available for this document.' });
    }

    const systemPrompt = `You are an expert family law document reviewer. Analyze the provided ${doc.document_type || 'legal document'} and return ONLY valid JSON with:
{
  "summary": "string",
  "parties": ["string"],
  "key_terms": ["string"],
  "risks": [{"description":"string","severity":"low|medium|high"}],
  "missing_provisions": ["string"],
  "deadlines": [{"description":"string","date":"YYYY-MM-DD or null"}],
  "recommendations": ["string"]
}`;

    const userPrompt = `Document filename: ${doc.filename}
Type: ${doc.document_type || 'unknown'}

CONTENT (truncated to 12000 chars):
${doc.text_content.substring(0, 12000)}`;

    const ai = await queryAI(systemPrompt, userPrompt);
    const { parsed } = parseAIJson(ai);

    await pool.query(
      'UPDATE uploaded_documents SET ai_analysis = $1, ai_results = $2, updated_at = NOW() WHERE id = $3',
      [ai, parsed, req.params.id]
    );

    res.json({ ai_analysis: ai, ai_results: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/uploads/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM uploaded_documents WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
