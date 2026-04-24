import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'financial_disclosures',
  'You are a financial expert specializing in family law. Analyze this financial disclosure and provide: 1) Completeness assessment, 2) Potential hidden assets indicators, 3) Income verification recommendations, 4) Tax filing considerations, 5) Financial planning advice post-divorce. Be thorough and professional.',
  (item) => `Disclosure Type: ${item.disclosure_type}\nIncome: $${item.annual_income}\nMonthly Expenses: $${item.monthly_expenses}\nTotal Assets: $${item.total_assets}\nTotal Debts: $${item.total_debts}\nEmployment: ${item.employment_type}\nDescription: ${item.description}\nNotes: ${item.notes || 'N/A'}`
);
