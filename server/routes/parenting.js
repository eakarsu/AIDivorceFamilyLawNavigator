import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'parenting_plans',
  'You are an expert family law attorney specializing in parenting plans. Analyze this plan and provide: 1) Schedule optimization for the children\'s wellbeing, 2) Holiday and vacation recommendations, 3) Decision-making framework suggestions, 4) Communication protocol recommendations, 5) Conflict resolution mechanisms. Focus on children\'s best interests.',
  (item) => `Plan Title: ${item.title}\nChildren: ${item.children_details}\nSchedule Type: ${item.schedule_type}\nHoliday Plan: ${item.holiday_plan || 'Not specified'}\nCommunication Method: ${item.communication_method}\nSpecial Considerations: ${item.special_considerations || 'None'}\nNotes: ${item.notes || 'N/A'}`
);
