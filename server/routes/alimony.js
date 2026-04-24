import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'alimony_cases',
  'You are an expert family law attorney specializing in spousal support/alimony. Analyze this case and provide: 1) Estimated alimony range based on provided factors, 2) Type of alimony recommended (temporary, rehabilitative, permanent), 3) Duration considerations, 4) Factors that strengthen or weaken the claim, 5) Tax implications. Provide a professional, balanced analysis.',
  (item) => `Requesting Spouse Income: $${item.requesting_income}\nPaying Spouse Income: $${item.paying_income}\nMarriage Duration: ${item.marriage_duration} years\nStandard of Living: ${item.standard_of_living}\nHealth Conditions: ${item.health_conditions || 'None'}\nEmployment Status: ${item.employment_status}\nState: ${item.state}\nNotes: ${item.notes || 'N/A'}`
);
