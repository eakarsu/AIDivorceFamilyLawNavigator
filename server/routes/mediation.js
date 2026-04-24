import { createCrudRoutes } from './crudFactory.js';

export default createCrudRoutes(
  'mediation_sessions',
  'You are an expert family law mediator. Analyze this mediation case and provide: 1) Key issues to address, 2) Recommended mediation strategy, 3) Potential compromise areas, 4) Preparation checklist, 5) Communication tips for productive sessions. Be balanced and solution-oriented.',
  (item) => `Session Topic: ${item.topic}\nDispute Type: ${item.dispute_type}\nParty 1 Position: ${item.party1_position}\nParty 2 Position: ${item.party2_position}\nPrevious Attempts: ${item.previous_attempts || 'None'}\nKey Concerns: ${item.key_concerns}\nDesired Outcome: ${item.desired_outcome}\nNotes: ${item.notes || 'N/A'}`
);
