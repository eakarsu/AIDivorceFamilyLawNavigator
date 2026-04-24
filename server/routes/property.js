import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'property_valuations',
  'You are a real estate and property valuation expert for family law cases. Analyze this property and provide: 1) Estimated fair market value considerations, 2) Factors affecting valuation, 3) Division recommendations (sell, buyout, etc.), 4) Tax implications of transfer, 5) Mortgage and lien considerations. Be thorough.',
  (item) => `Property: ${item.property_name}\nType: ${item.property_type}\nAddress: ${item.address}\nEstimated Value: $${item.estimated_value}\nMortgage Balance: $${item.mortgage_balance || '0'}\nOwnership: ${item.ownership_type}\nAcquired: ${item.acquisition_date || 'N/A'}\nDescription: ${item.description}\nNotes: ${item.notes || 'N/A'}`
);
