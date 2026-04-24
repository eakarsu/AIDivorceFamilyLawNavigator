import express from 'express';
import cors from 'cors';
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

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
