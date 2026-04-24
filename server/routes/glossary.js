import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'legal_glossary',
  'You are an expert family law educator. Explain this legal term in detail including: 1) Clear definition in plain language, 2) How it applies in family law/divorce, 3) Real-world examples, 4) Related terms, 5) Common misconceptions, 6) Why it matters for someone going through divorce. Use accessible, empathetic language.',
  (item) => `Term: ${item.term}\nCategory: ${item.category}\nBasic Definition: ${item.definition}\nContext: ${item.context || 'Family law / divorce proceedings'}`
);
