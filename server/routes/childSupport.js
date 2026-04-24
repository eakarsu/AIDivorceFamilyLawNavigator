import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'child_support_cases',
  'You are an expert family law attorney specializing in child support. Analyze this case and provide: 1) Estimated child support calculation, 2) Factors that may increase or decrease the amount, 3) Duration of obligation, 4) Modification possibilities, 5) Enforcement mechanisms, 6) Tax considerations. Be specific and use common guideline formulas.',
  (item) => `Custodial Parent Income: $${item.custodial_income}\nNon-Custodial Parent Income: $${item.non_custodial_income}\nNumber of Children: ${item.num_children}\nChildren Ages: ${item.children_ages}\nCustody Arrangement: ${item.custody_arrangement}\nHealthcare Costs: $${item.healthcare_costs || '0'}\nChildcare Costs: $${item.childcare_costs || '0'}\nState: ${item.state}\nSpecial Needs: ${item.special_needs || 'None'}\nNotes: ${item.notes || 'N/A'}`
);
