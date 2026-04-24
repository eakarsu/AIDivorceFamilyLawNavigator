import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'generated_documents',
  'You are an expert family law attorney. Generate a professional legal document based on the following details. Include proper legal language, standard clauses, and formatting. Add appropriate disclaimers that this is a template and should be reviewed by a licensed attorney.',
  (item) => `Document Type: ${item.document_type}\nTitle: ${item.title}\nParty 1: ${item.party1_name}\nParty 2: ${item.party2_name}\nState/Jurisdiction: ${item.jurisdiction}\nKey Terms: ${item.key_terms}\nSpecial Provisions: ${item.special_provisions || 'None'}\nNotes: ${item.notes || 'N/A'}`
);
