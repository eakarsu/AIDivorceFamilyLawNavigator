import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'legal_rights',
  'You are an expert family law attorney. Explain the legal rights in detail including: 1) Full explanation of this right, 2) How it applies in divorce/family law, 3) State-specific variations, 4) How to exercise this right, 5) Common misconceptions, 6) Related rights and protections. Use clear, accessible language.',
  (item) => `Right/Topic: ${item.title}\nCategory: ${item.category}\nState: ${item.state}\nDescription: ${item.description}\nSituation: ${item.situation || 'General inquiry'}\nNotes: ${item.notes || 'N/A'}`
);
