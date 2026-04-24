import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'settlement_agreements',
  'You are an expert family law attorney specializing in settlement agreements. Analyze this agreement and provide: 1) Fairness assessment, 2) Missing provisions that should be included, 3) Potential enforcement issues, 4) Tax implications, 5) Recommendations for modifications, 6) Comparison to typical settlements. Be thorough and balanced.',
  (item) => `Agreement Title: ${item.title}\nType: ${item.agreement_type}\nParty 1: ${item.party1_name}\nParty 2: ${item.party2_name}\nKey Terms: ${item.key_terms}\nAsset Division: ${item.asset_division || 'Not specified'}\nSupport Terms: ${item.support_terms || 'Not specified'}\nCustody Terms: ${item.custody_terms || 'Not specified'}\nNotes: ${item.notes || 'N/A'}`
);
