import { Router } from 'express';
import PDFDocument from 'pdfkit';
import pool from '../config/db.js';
import { auth } from '../middleware/auth.js';
import { ALLOWED_TABLES } from './crudFactory.js';

const router = Router();

const DISCLAIMER = 'DISCLAIMER: This document was generated with AI assistance. It is informational only and not a substitute for legal advice from a licensed attorney. Review carefully and have it vetted by counsel before relying on it for any legal proceeding.';

/**
 * GET /api/export/:table/:id/pdf
 * Streams a PDF representation of any allowed entity row, including its ai_analysis text.
 */
router.get('/:table/:id/pdf', auth, async (req, res) => {
  try {
    const table = String(req.params.table).toLowerCase();
    if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: 'Unknown table' });

    const r = await pool.query(`SELECT * FROM ${table} WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const row = r.rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${table}-${row.id}.pdf"`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
    doc.pipe(res);

    doc.fontSize(18).text(`${table.replace(/_/g, ' ').toUpperCase()}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555').text(`Record ID: ${row.id} | Generated: ${new Date().toISOString()}`);
    doc.moveDown(1);
    doc.fillColor('#000');

    const skipKeys = new Set(['id', 'user_id', 'created_at', 'updated_at', 'ai_analysis', 'ai_results']);
    for (const [k, v] of Object.entries(row)) {
      if (skipKeys.has(k)) continue;
      if (v == null || v === '') continue;
      doc.font('Helvetica-Bold').fontSize(11).text(`${k.replace(/_/g, ' ')}:`, { continued: false });
      doc.font('Helvetica').fontSize(11).text(String(v));
      doc.moveDown(0.3);
    }

    if (row.ai_analysis) {
      doc.addPage();
      doc.fontSize(14).text('AI Analysis', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text(String(row.ai_analysis));
    }

    doc.addPage();
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#444').text(DISCLAIMER, { align: 'left' });
    doc.fillColor('#000');

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
