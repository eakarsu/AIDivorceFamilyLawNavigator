import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'divorce_timelines',
  'You are an expert family law attorney. Analyze this divorce timeline and provide: 1) Realistic timeline estimate for completion, 2) Critical milestones and deadlines, 3) Potential delays and how to avoid them, 4) Required waiting periods by jurisdiction, 5) Preparation tasks for each phase, 6) Cost estimates by phase. Be practical and realistic.',
  (item) => `Case Title: ${item.title}\nDivorce Type: ${item.divorce_type}\nState: ${item.state}\nFiling Date: ${item.filing_date || 'Not yet filed'}\nContested: ${item.is_contested ? 'Yes' : 'No'}\nChildren Involved: ${item.has_children ? 'Yes' : 'No'}\nProperty Involved: ${item.has_property ? 'Yes' : 'No'}\nCurrent Phase: ${item.current_phase}\nNotes: ${item.notes || 'N/A'}`
);
