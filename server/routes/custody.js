import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'custody_cases',
  'You are an expert family law attorney specializing in child custody. Analyze this custody situation and provide: 1) Best interests of the child analysis, 2) Recommended custody arrangement, 3) Visitation schedule suggestions, 4) Factors that may influence court decisions, 5) Tips for co-parenting success. Be compassionate and child-focused.',
  (item) => `Child Name: ${item.child_name}\nChild Age: ${item.child_age}\nCurrent Arrangement: ${item.current_arrangement}\nDesired Arrangement: ${item.desired_arrangement}\nSpecial Needs: ${item.special_needs || 'None'}\nParent Situation: ${item.parent_situation}\nNotes: ${item.notes || 'N/A'}`
);
