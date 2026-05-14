import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus, ArrowLeft, Trash2, Edit3, Sparkles, Save, X, Loader2,
  ChevronRight, AlertCircle, CheckCircle, Download
} from 'lucide-react';
import AIResponseDisplay from '../components/AIResponseDisplay';

const fieldLabels = {
  title: 'Title', document_type: 'Document Type', description: 'Description',
  content: 'Content', parties: 'Parties', status: 'Status', name: 'Name',
  asset_type: 'Asset Type', estimated_value: 'Estimated Value', ownership: 'Ownership',
  acquisition_date: 'Acquisition Date', notes: 'Notes', child_name: 'Child Name',
  child_age: 'Child Age', current_arrangement: 'Current Arrangement',
  desired_arrangement: 'Desired Arrangement', special_needs: 'Special Needs',
  parent_situation: 'Parent Situation', requesting_income: 'Requesting Spouse Income',
  paying_income: 'Paying Spouse Income', marriage_duration: 'Marriage Duration (years)',
  standard_of_living: 'Standard of Living', health_conditions: 'Health Conditions',
  employment_status: 'Employment Status', state: 'State', party1_name: 'Party 1 Name',
  party2_name: 'Party 2 Name', jurisdiction: 'Jurisdiction', key_terms: 'Key Terms',
  special_provisions: 'Special Provisions', topic: 'Topic', dispute_type: 'Dispute Type',
  party1_position: 'Party 1 Position', party2_position: 'Party 2 Position',
  previous_attempts: 'Previous Attempts', key_concerns: 'Key Concerns',
  desired_outcome: 'Desired Outcome', filing_type: 'Filing Type', case_type: 'Case Type',
  urgency: 'Urgency', filing_date: 'Filing Date', disclosure_type: 'Disclosure Type',
  annual_income: 'Annual Income', monthly_expenses: 'Monthly Expenses',
  total_assets: 'Total Assets', total_debts: 'Total Debts', employment_type: 'Employment Type',
  children_details: 'Children Details', schedule_type: 'Schedule Type',
  holiday_plan: 'Holiday Plan', communication_method: 'Communication Method',
  special_considerations: 'Special Considerations', property_name: 'Property Name',
  property_type: 'Property Type', address: 'Address', mortgage_balance: 'Mortgage Balance',
  ownership_type: 'Ownership Type', category: 'Category', situation: 'Situation',
  agreement_type: 'Agreement Type', asset_division: 'Asset Division',
  support_terms: 'Support Terms', custody_terms: 'Custody Terms',
  custodial_income: 'Custodial Parent Income', non_custodial_income: 'Non-Custodial Income',
  num_children: 'Number of Children', children_ages: 'Children Ages',
  custody_arrangement: 'Custody Arrangement', healthcare_costs: 'Healthcare Costs',
  childcare_costs: 'Childcare Costs', divorce_type: 'Divorce Type',
  is_contested: 'Contested', has_children: 'Has Children', has_property: 'Has Property',
  current_phase: 'Current Phase', term: 'Term', definition: 'Definition', context: 'Context',
  scheduled_date: 'Scheduled Date',
};

const numericFields = ['estimated_value', 'requesting_income', 'paying_income', 'marriage_duration',
  'annual_income', 'monthly_expenses', 'total_assets', 'total_debts', 'mortgage_balance',
  'custodial_income', 'non_custodial_income', 'num_children', 'healthcare_costs', 'childcare_costs', 'child_age'];

const booleanFields = ['is_contested', 'has_children', 'has_property'];
const dateFields = ['acquisition_date', 'filing_date', 'scheduled_date'];
const textareaFields = ['description', 'content', 'notes', 'key_terms', 'special_provisions',
  'party1_position', 'party2_position', 'previous_attempts', 'key_concerns', 'desired_outcome',
  'children_details', 'holiday_plan', 'special_considerations', 'address', 'situation',
  'asset_division', 'support_terms', 'custody_terms', 'parent_situation', 'special_needs',
  'health_conditions', 'definition', 'context'];

function getDisplayName(item, fields) {
  return item.title || item.name || item.property_name || item.child_name || item.term || item.topic || `Item #${item.id}`;
}

// Map URL endpoint -> actual database table name (for /api/export/:table/:id/pdf)
const ENDPOINT_TO_TABLE = {
  documents: 'legal_documents',
  assets: 'marital_assets',
  custody: 'custody_cases',
  alimony: 'alimony_cases',
  'document-gen': 'generated_documents',
  mediation: 'mediation_sessions',
  filing: 'court_filings',
  financial: 'financial_disclosures',
  parenting: 'parenting_plans',
  property: 'property_valuations',
  rights: 'legal_rights',
  settlement: 'settlement_agreements',
  'child-support': 'child_support_cases',
  timeline: 'divorce_timelines',
  glossary: 'legal_glossary',
};

function getSubtext(item) {
  return item.document_type || item.asset_type || item.agreement_type || item.dispute_type ||
    item.filing_type || item.disclosure_type || item.property_type || item.category ||
    item.divorce_type || item.schedule_type || item.status || '';
}

function formatValue(key, value) {
  if (value === null || value === undefined) return '—';
  if (booleanFields.includes(key)) return value ? 'Yes' : 'No';
  if (numericFields.includes(key) && !['num_children', 'marriage_duration', 'child_age'].includes(key)) {
    return `$${Number(value).toLocaleString()}`;
  }
  if (dateFields.includes(key) && value) return new Date(value).toLocaleDateString();
  return String(value);
}

export default function FeaturePage({ config }) {
  const { endpoint, title, fields } = config;
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadItems();
    setSelected(null);
    setEditing(false);
    setCreating(false);
  }, [endpoint]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${endpoint}`);
      setItems(res.data);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const selectItem = async (id) => {
    try {
      const res = await api.get(`/${endpoint}/${id}`);
      setSelected(res.data);
      setEditing(false);
      setCreating(false);
    } catch (err) {
      setError('Failed to load item');
    }
  };

  const startCreate = () => {
    const empty = {};
    fields.forEach(f => {
      if (booleanFields.includes(f)) empty[f] = false;
      else empty[f] = '';
    });
    setFormData(empty);
    setCreating(true);
    setEditing(false);
    setSelected(null);
  };

  const startEdit = () => {
    const data = {};
    fields.forEach(f => { data[f] = selected[f] ?? ''; });
    setFormData(data);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const cleaned = { ...formData };
      numericFields.forEach(f => { if (f in cleaned && cleaned[f] !== '') cleaned[f] = Number(cleaned[f]); });

      if (creating) {
        const res = await api.post(`/${endpoint}`, cleaned);
        setItems([res.data, ...items]);
        setSelected(res.data);
        setCreating(false);
        setSuccess('Item created successfully');
      } else {
        const res = await api.put(`/${endpoint}/${selected.id}`, cleaned);
        setSelected(res.data);
        setItems(items.map(i => i.id === res.data.id ? res.data : i));
        setEditing(false);
        setSuccess('Item updated successfully');
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/${endpoint}/${selected.id}`);
      setItems(items.filter(i => i.id !== selected.id));
      setSelected(null);
      setSuccess('Item deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.post(`/${endpoint}/${selected.id}/analyze`);
      setSelected({ ...selected, ai_analysis: res.data.ai_analysis });
      setItems(items.map(i => i.id === selected.id ? { ...i, ai_analysis: res.data.ai_analysis } : i));
    } catch (err) {
      setError(err.response?.data?.error || 'AI analysis failed. Check your OpenRouter API key.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // Detail / Edit / Create View
  if (selected || creating) {
    return (
      <div className="max-w-4xl mx-auto fade-in">
        <button
          onClick={() => { setSelected(null); setCreating(false); setEditing(false); }}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition"
        >
          <ArrowLeft size={18} /> Back to {title}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {creating ? `New ${title}` : (editing ? `Edit: ${getDisplayName(selected, fields)}` : getDisplayName(selected, fields))}
            </h2>
            {!creating && !editing && (
              <div className="flex gap-2">
                {ENDPOINT_TO_TABLE[endpoint] && (
                  <a
                    href={`/api/export/${ENDPOINT_TO_TABLE[endpoint]}/${selected.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                  >
                    <Download size={15} /> Export PDF
                  </a>
                )}
                <button onClick={startEdit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                  <Edit3 size={15} /> Edit
                </button>
                <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {editing || creating ? (
              <div className="space-y-4">
                {fields.map(f => (
                  <div key={f}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {fieldLabels[f] || f}
                    </label>
                    {booleanFields.includes(f) ? (
                      <select
                        value={formData[f] ? 'true' : 'false'}
                        onChange={e => setFormData({ ...formData, [f]: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    ) : dateFields.includes(f) ? (
                      <input
                        type="date"
                        value={formData[f] || ''}
                        onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    ) : textareaFields.includes(f) ? (
                      <textarea
                        value={formData[f] || ''}
                        onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                      />
                    ) : (
                      <input
                        type={numericFields.includes(f) ? 'number' : 'text'}
                        value={formData[f] || ''}
                        onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setCreating(false); }}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.filter(f => !textareaFields.includes(f)).map(f => (
                    <div key={f} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        {fieldLabels[f] || f}
                      </p>
                      <p className="text-gray-800 font-medium">{formatValue(f, selected[f])}</p>
                    </div>
                  ))}
                </div>
                {fields.filter(f => textareaFields.includes(f) && selected[f]).map(f => (
                  <div key={f} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {fieldLabels[f] || f}
                    </p>
                    <p className="text-gray-800 whitespace-pre-wrap">{selected[f]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        {!creating && !editing && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <Sparkles className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">AI Analysis</h3>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition text-sm ${
                  analyzing
                    ? 'bg-blue-100 text-blue-400 cursor-wait ai-loading'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                }`}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {selected.ai_analysis ? 'Re-Analyze with AI' : 'Analyze with AI'}
                  </>
                )}
              </button>
            </div>
            <div className="p-6">
              {selected.ai_analysis ? (
                <AIResponseDisplay content={selected.ai_analysis} />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click "Analyze with AI" to get AI-powered insights</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="max-w-5xl mx-auto fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} items</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
        >
          <Plus size={18} /> New Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No items yet</h3>
          <p className="text-gray-400 mb-4">Create your first item to get started</p>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus size={18} /> Create New
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => selectItem(item.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50/50 transition text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition truncate">
                    {getDisplayName(item, fields)}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{getSubtext(item)}</p>
                </div>
                {item.ai_analysis && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                    <Sparkles size={12} /> AI
                  </span>
                )}
                {item.status && (
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active' || item.status === 'completed' ? 'bg-green-50 text-green-600' :
                    item.status === 'urgent' ? 'bg-red-50 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
