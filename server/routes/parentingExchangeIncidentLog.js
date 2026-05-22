import express from 'express';

const router = express.Router();

const incidents = [
  { id: 1, child: 'A.R.', exchangeDate: '2026-05-18', location: 'School pickup loop', category: 'late arrival', severity: 'medium', followUp: 'confirm revised pickup window' },
  { id: 2, child: 'M.R.', exchangeDate: '2026-05-20', location: 'Community center', category: 'missed medication handoff', severity: 'high', followUp: 'document medication protocol' },
  { id: 3, child: 'A.R.', exchangeDate: '2026-05-22', location: 'Library', category: 'communication issue', severity: 'low', followUp: 'send co-parenting app reminder' },
];

router.get('/', (req, res) => {
  res.json({
    summary: {
      incidentCount: incidents.length,
      highSeverity: incidents.filter((item) => item.severity === 'high').length,
      pendingFollowUps: incidents.length,
    },
    incidents,
  });
});

router.post('/plan', (req, res) => {
  const incident = incidents.find((item) => item.id === Number(req.body?.incidentId)) || incidents[0];
  res.json({
    incidentId: incident.id,
    neutralSummary: `${incident.category} recorded at ${incident.location} for ${incident.child}.`,
    nextSteps: ['Preserve factual timeline', incident.followUp, 'Avoid accusatory language in parent communication'],
  });
});

export default router;
