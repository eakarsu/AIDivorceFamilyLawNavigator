import { Router } from 'express';
import PDFDocument from 'pdfkit';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const TABLE = 'generated_documents';
const AI_SYSTEM_PROMPT = 'You are an expert family law attorney. Generate a professional legal document based on the following details. Include proper legal language, standard clauses, and formatting. Add appropriate disclaimers that this is a template and should be reviewed by a licensed attorney.';
const aiFieldFn = (item) => `Document Type: ${item.document_type}\nTitle: ${item.title}\nParty 1: ${item.party1_name}\nParty 2: ${item.party2_name}\nState/Jurisdiction: ${item.jurisdiction}\nKey Terms: ${item.key_terms}\nSpecial Provisions: ${item.special_provisions || 'None'}\nNotes: ${item.notes || 'N/A'}`;

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json(result.rows);
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

// GET export as PDF
router.get('/:id/export', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const doc_item = result.rows[0];
    const content = doc_item.ai_analysis || 'No content generated yet. Please run AI analysis first.';

    const doc = new PDFDocument({ margin: 60 });

    const safeTitle = (doc_item.title || 'Legal Document').replace(/[^a-zA-Z0-9 _-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(doc_item.title || 'Legal Document', { align: 'center' });
    doc.moveDown(0.5);

    // Metadata
    doc.fontSize(11).font('Helvetica');
    if (doc_item.document_type) doc.text(`Document Type: ${doc_item.document_type}`);
    if (doc_item.party1_name) doc.text(`Party 1: ${doc_item.party1_name}`);
    if (doc_item.party2_name) doc.text(`Party 2: ${doc_item.party2_name}`);
    if (doc_item.jurisdiction) doc.text(`Jurisdiction: ${doc_item.jurisdiction}`);
    doc.text(`Generated: ${new Date(doc_item.created_at).toLocaleDateString()}`);
    doc.moveDown();

    // Divider
    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke();
    doc.moveDown();

    // Content
    doc.fontSize(12).font('Helvetica').text(content, { align: 'left', lineGap: 4 });

    // Legal disclaimer footer
    doc.moveDown(2);
    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#555555').text(
      'DISCLAIMER: This document was AI-generated and does not constitute legal advice. Consult a licensed attorney before relying on this document for any legal purpose.',
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
router.post('/', auth, async (req, res) => {
  try {
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
