import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'court_filings',
  'You are an expert family law attorney. Provide detailed court filing guidance including: 1) Required forms and documents, 2) Filing procedures and fees, 3) Timeline and deadlines, 4) Common mistakes to avoid, 5) Next steps after filing. Be specific to the jurisdiction mentioned.',
  (item) => `Filing Type: ${item.filing_type}\nCourt/Jurisdiction: ${item.jurisdiction}\nCase Type: ${item.case_type}\nFiling Status: ${item.status}\nDescription: ${item.description}\nUrgency: ${item.urgency}\nNotes: ${item.notes || 'N/A'}`
);
