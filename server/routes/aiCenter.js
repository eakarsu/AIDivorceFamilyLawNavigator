import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { queryAI } from '../config/openrouter.js';

const router = Router();

const AI_FEATURES = [
  { id: 'legal-advisor', name: 'Legal Rights Advisor', description: 'Get AI-powered advice on your legal rights in divorce proceedings', icon: 'Scale' },
  { id: 'document-review', name: 'Document Review', description: 'AI analysis of legal documents for risks and recommendations', icon: 'FileSearch' },
  { id: 'custody-advisor', name: 'Custody Strategy Advisor', description: 'AI guidance on custody arrangements and best practices', icon: 'Users' },
  { id: 'financial-analyzer', name: 'Financial Impact Analyzer', description: 'Analyze financial implications of divorce decisions', icon: 'DollarSign' },
  { id: 'settlement-evaluator', name: 'Settlement Evaluator', description: 'Evaluate fairness and completeness of settlement proposals', icon: 'Handshake' },
  { id: 'mediation-coach', name: 'Mediation Coach', description: 'Prepare for mediation with AI-powered coaching and strategy', icon: 'MessageCircle' },
  { id: 'asset-classifier', name: 'Asset Classifier', description: 'Classify assets as marital or separate property', icon: 'Building' },
  { id: 'support-calculator', name: 'Support Calculator', description: 'Estimate child support and alimony amounts', icon: 'Calculator' },
  { id: 'timeline-planner', name: 'Divorce Timeline Planner', description: 'Plan your divorce process timeline with realistic estimates', icon: 'Calendar' },
  { id: 'legal-term-explainer', name: 'Legal Term Explainer', description: 'Get plain-language explanations of legal terminology', icon: 'BookOpen' },
  { id: 'parenting-plan-advisor', name: 'Parenting Plan Advisor', description: 'Get AI help creating effective parenting plans', icon: 'Heart' },
  { id: 'filing-guide', name: 'Court Filing Guide', description: 'Step-by-step guidance for court filing procedures', icon: 'FileText' },
  { id: 'emotional-support', name: 'Emotional Wellness Guide', description: 'Resources and coping strategies during divorce', icon: 'Shield' },
  { id: 'property-advisor', name: 'Property Division Advisor', description: 'AI guidance on fair property division strategies', icon: 'Home' },
  { id: 'negotiation-coach', name: 'Negotiation Coach', description: 'AI-powered negotiation strategies and tactics', icon: 'Target' },
];

const SYSTEM_PROMPTS = {
  'legal-advisor': 'You are an expert family law attorney. Provide comprehensive legal rights advice for divorce and family law situations. Be empathetic, thorough, and always recommend consulting with a licensed attorney for specific legal decisions.',
  'document-review': 'You are an expert legal document analyst specializing in family law. Review and analyze legal documents, identifying key terms, risks, and recommendations.',
  'custody-advisor': 'You are a family law expert specializing in child custody. Provide guidance focused on the best interests of children, with practical advice for custody arrangements.',
  'financial-analyzer': 'You are a financial expert specializing in divorce financial planning. Analyze income, assets, debts, and provide comprehensive financial guidance for divorce.',
  'settlement-evaluator': 'You are an expert family law attorney who evaluates settlement agreements. Assess fairness, identify missing provisions, and suggest improvements.',
  'mediation-coach': 'You are an expert mediator and negotiation coach for family law disputes. Provide strategies, communication tips, and preparation guidance.',
  'asset-classifier': 'You are a family law property expert. Classify assets as marital or separate property and explain the legal basis for the classification.',
  'support-calculator': 'You are a family law financial expert. Calculate and explain child support and alimony estimates based on income, custody, and state guidelines.',
  'timeline-planner': 'You are a family law process expert. Create realistic divorce timelines with milestones, deadlines, and preparation tasks.',
  'legal-term-explainer': 'You are a legal educator specializing in family law. Explain legal terms in plain language with examples and context relevant to divorce proceedings.',
  'parenting-plan-advisor': 'You are a child psychology and family law expert. Help create comprehensive parenting plans that prioritize children\'s wellbeing.',
  'filing-guide': 'You are a court procedures expert for family law cases. Provide step-by-step guidance for filing court documents in divorce and family law cases.',
  'emotional-support': 'You are a compassionate counselor specializing in divorce and family transitions. Provide emotional support resources, coping strategies, and wellness advice. Always recommend professional therapy when appropriate.',
  'property-advisor': 'You are a property division expert in family law. Provide advice on equitable distribution, community property, and property valuation strategies.',
  'negotiation-coach': 'You are an expert negotiation strategist for family law cases. Provide tactics, communication strategies, and preparation advice for divorce negotiations.',
};

router.get('/features', auth, async (req, res) => {
  res.json(AI_FEATURES);
});

router.post('/query', auth, async (req, res) => {
  try {
    const { featureId, prompt } = req.body;
    const systemPrompt = SYSTEM_PROMPTS[featureId] || SYSTEM_PROMPTS['legal-advisor'];
    const response = await queryAI(systemPrompt, prompt);
    res.json({ response, featureId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
