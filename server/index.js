import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import assetRoutes from './routes/assets.js';
import custodyRoutes from './routes/custody.js';
import alimonyRoutes from './routes/alimony.js';
import documentGenRoutes from './routes/documentGen.js';
import mediationRoutes from './routes/mediation.js';
import filingRoutes from './routes/filing.js';
import financialRoutes from './routes/financial.js';
import parentingRoutes from './routes/parenting.js';
import propertyRoutes from './routes/property.js';
import rightsRoutes from './routes/rights.js';
import settlementRoutes from './routes/settlement.js';
import childSupportRoutes from './routes/childSupport.js';
import timelineRoutes from './routes/timeline.js';
import glossaryRoutes from './routes/glossary.js';
import aiCenterRoutes from './routes/aiCenter.js';
import courtDatesRoutes from './routes/courtDates.js';
import aiNewRoutes from './routes/aiNew.js';
import uploadsRoutes from './routes/uploads.js';
import stateLawRoutes from './routes/stateLaw.js';
import conversationRoutes from './routes/conversations.js';
import exportPdfRoutes from './routes/exportPdf.js';
import parentingExchangeIncidentLogRoutes from './routes/parentingExchangeIncidentLog.js';
import navigationWorkflowRoutes from './routes/navigationWorkflow.js';
import { validateRuntime } from './config/runtime.js';

validateRuntime();

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Env-driven CORS allowlist (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS: origin not allowed'), false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api', (req, res, next) => {
  const supported = ['/auth', '/navigation', '/ai', '/health'];
  if (supported.some(prefix => req.path.startsWith(prefix))) return next();
  if (process.env.ENABLE_LEGACY_LEGAL_SURFACES === 'true' && process.env.NODE_ENV !== 'production') return next();
  return res.status(404).json({ error: 'Legacy generated endpoint is outside the sourced legal-navigation boundary' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/custody', custodyRoutes);
app.use('/api/alimony', alimonyRoutes);
app.use('/api/document-gen', documentGenRoutes);
app.use('/api/mediation', mediationRoutes);
app.use('/api/filing', filingRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/parenting', parentingRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/rights', rightsRoutes);
app.use('/api/settlement', settlementRoutes);
app.use('/api/child-support', childSupportRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/glossary', glossaryRoutes);
app.use('/api/ai-center', aiCenterRoutes);
app.use('/api/court-dates', courtDatesRoutes);
app.use('/api/ai', aiNewRoutes);





app.use('/api/ai', (await import('./routes/custodyOutcome.js')).default);
app.use('/api/ai', (await import('./routes/coparenting.js')).default);
app.use('/api/ai', (await import('./routes/assetValuation.js')).default);
app.use('/api/ai', (await import('./routes/settlementOptimize.js')).default);
app.use('/api/ai', (await import('./routes/stateGuidance.js')).default);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/state-law', stateLawRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/export', exportPdfRoutes);
app.use('/api/parenting-exchange-incident-log', parentingExchangeIncidentLogRoutes);
app.use('/api/navigation', navigationWorkflowRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  if (err.message && err.message.startsWith('CORS:')) return res.status(403).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;
// // === Batch 02 Gaps & Frontend Mounts === (disabled: CommonJS require in ESM module)
// app.use('/api/gap-missing-calculate-child-support-calculate-alimony-recommend', require('./routes/gap_missing_calculate_child_support_calculate_alimony_recommend'));
// app.use('/api/gap-limited-integration-with-court-records-filing-systems', require('./routes/gap_limited_integration_with_court_records_filing_systems'));
// app.use('/api/gap-no-e-signature-integration', require('./routes/gap_no_e_signature_integration'));
// app.use('/api/gap-limited-legal-research-integration-lexisnexis-westlaw', require('./routes/gap_limited_legal_research_integration_lexisnexis_westlaw'));
// app.use('/api/gap-no-co-parenting-app-or-family-communication-tools', require('./routes/gap_no_co_parenting_app_or_family_communication_tools'));
// app.use('/api/gap-no-webhooks', require('./routes/gap_no_webhooks'));
// app.use('/api/gap-no-payment-billing-module', require('./routes/gap_no_payment_billing_module'));
// app.use('/api/gap-no-reporting-beyond-stubs', require('./routes/gap_no_reporting_beyond_stubs'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
