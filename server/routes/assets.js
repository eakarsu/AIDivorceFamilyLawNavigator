import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'marital_assets',
  'You are an expert family law attorney specializing in asset division. Analyze this marital asset and provide: 1) Fair market value assessment considerations, 2) Classification as marital vs separate property, 3) Recommended division approach, 4) Tax implications to consider, 5) Key factors that may affect division. Format professionally with headers.',
  (item) => `Asset: ${item.name}\nType: ${item.asset_type}\nEstimated Value: $${item.estimated_value}\nOwnership: ${item.ownership}\nAcquired: ${item.acquisition_date || 'N/A'}\nDescription: ${item.description}\nNotes: ${item.notes || 'N/A'}`
);
