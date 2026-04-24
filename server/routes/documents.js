import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'legal_documents',
  'You are an expert family law attorney AI assistant. Analyze the following legal document and provide: 1) A clear summary of key terms and provisions, 2) Potential risks or concerns, 3) Important deadlines or obligations, 4) Recommendations for the client. Format your response with clear headers and bullet points.',
  (item) => `Document Title: ${item.title}\nDocument Type: ${item.document_type}\nDescription: ${item.description}\nContent: ${item.content || 'N/A'}\nParties Involved: ${item.parties || 'N/A'}`
);
