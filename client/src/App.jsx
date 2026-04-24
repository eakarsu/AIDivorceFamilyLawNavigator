import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AICenter from './pages/AICenter';

const features = [
  { path: 'documents', endpoint: 'documents', title: 'Document Analyzer', icon: 'FileSearch', fields: ['title', 'document_type', 'description', 'content', 'parties', 'status'] },
  { path: 'assets', endpoint: 'assets', title: 'Asset Division Calculator', icon: 'PieChart', fields: ['name', 'asset_type', 'estimated_value', 'ownership', 'acquisition_date', 'description', 'notes'] },
  { path: 'custody', endpoint: 'custody', title: 'Child Custody Advisor', icon: 'Users', fields: ['child_name', 'child_age', 'current_arrangement', 'desired_arrangement', 'special_needs', 'parent_situation', 'notes', 'status'] },
  { path: 'alimony', endpoint: 'alimony', title: 'Alimony Estimator', icon: 'DollarSign', fields: ['title', 'requesting_income', 'paying_income', 'marriage_duration', 'standard_of_living', 'health_conditions', 'employment_status', 'state', 'notes', 'status'] },
  { path: 'document-gen', endpoint: 'document-gen', title: 'Document Generator', icon: 'FileText', fields: ['title', 'document_type', 'party1_name', 'party2_name', 'jurisdiction', 'key_terms', 'special_provisions', 'notes', 'status'] },
  { path: 'mediation', endpoint: 'mediation', title: 'Mediation Assistant', icon: 'MessageCircle', fields: ['topic', 'dispute_type', 'party1_position', 'party2_position', 'previous_attempts', 'key_concerns', 'desired_outcome', 'notes', 'status'] },
  { path: 'filing', endpoint: 'filing', title: 'Court Filing Guide', icon: 'Gavel', fields: ['title', 'filing_type', 'jurisdiction', 'case_type', 'description', 'urgency', 'filing_date', 'notes', 'status'] },
  { path: 'financial', endpoint: 'financial', title: 'Financial Disclosure', icon: 'BarChart3', fields: ['title', 'disclosure_type', 'annual_income', 'monthly_expenses', 'total_assets', 'total_debts', 'employment_type', 'description', 'notes', 'status'] },
  { path: 'parenting', endpoint: 'parenting', title: 'Parenting Plan Creator', icon: 'Heart', fields: ['title', 'children_details', 'schedule_type', 'holiday_plan', 'communication_method', 'special_considerations', 'notes', 'status'] },
  { path: 'property', endpoint: 'property', title: 'Property Valuation', icon: 'Home', fields: ['property_name', 'property_type', 'address', 'estimated_value', 'mortgage_balance', 'ownership_type', 'acquisition_date', 'description', 'notes', 'status'] },
  { path: 'rights', endpoint: 'rights', title: 'Legal Rights Advisor', icon: 'Scale', fields: ['title', 'category', 'state', 'description', 'situation', 'notes'] },
  { path: 'settlement', endpoint: 'settlement', title: 'Settlement Builder', icon: 'Handshake', fields: ['title', 'agreement_type', 'party1_name', 'party2_name', 'key_terms', 'asset_division', 'support_terms', 'custody_terms', 'notes', 'status'] },
  { path: 'child-support', endpoint: 'child-support', title: 'Child Support Calculator', icon: 'Calculator', fields: ['title', 'custodial_income', 'non_custodial_income', 'num_children', 'children_ages', 'custody_arrangement', 'healthcare_costs', 'childcare_costs', 'state', 'special_needs', 'notes', 'status'] },
  { path: 'timeline', endpoint: 'timeline', title: 'Divorce Timeline', icon: 'Calendar', fields: ['title', 'divorce_type', 'state', 'filing_date', 'is_contested', 'has_children', 'has_property', 'current_phase', 'notes', 'status'] },
  { path: 'glossary', endpoint: 'glossary', title: 'Legal Glossary', icon: 'BookOpen', fields: ['term', 'category', 'definition', 'context'] },
];

export { features };

export default function App() {
  const { user } = useAuth();

  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {features.map(f => (
          <Route key={f.path} path={`/${f.path}`} element={<FeaturePage config={f} />} />
        ))}
        <Route path="/ai-center" element={<AICenter />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
