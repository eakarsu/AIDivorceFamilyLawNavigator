import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { Plus, Loader2 } from 'lucide-react';
import AIReport, { reportText, readableLabel } from '../components/AIReport';
import Modal from '../components/AIWorkspaceModal';
import { isCancelled, recordDetail, recordList, requestError, demoLabel } from '../services/recordData';
import { recordExamples } from '../services/recordExamples';

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
  'custodial_income', 'non_custodial_income', 'num_children', 'healthcare_costs', 'childcare_costs', 'child_age', 'case_id'];

const booleanFields = ['is_contested', 'has_children', 'has_property'];
const dateFields = ['acquisition_date', 'filing_date', 'scheduled_date', 'date', 'exchangeDate'];
const textareaFields = ['description', 'content', 'notes', 'key_terms', 'special_provisions',
  'party1_position', 'party2_position', 'previous_attempts', 'key_concerns', 'desired_outcome',
  'children_details', 'holiday_plan', 'special_considerations', 'address', 'situation',
  'asset_division', 'support_terms', 'custody_terms', 'parent_situation', 'special_needs',
  'health_conditions', 'definition', 'context', 'text_content', 'research_question', 'followUp'];

function getDisplayName(item, fields) {
  return item.title || item.name || item.property_name || item.child_name || item.term || item.topic || item.filename || item.child || item.task || item.research_question || item.state_code || `Item #${item.id}`;
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
  if (numericFields.includes(key) && !['num_children', 'marriage_duration', 'child_age', 'case_id'].includes(key)) {
    return `$${Number(value).toLocaleString()}`;
  }
  if (key === 'date' && value) return new Date(value).toLocaleString();
  if (dateFields.includes(key) && value) return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString();
  return String(value);
}

function localTimestamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23);
}

function savedTimestamp(value, original) {
  if (!value) return null;
  // Preserve an unchanged source instant even during the repeated DST hour.
  if (original && value === localTimestamp(original)) return new Date(original).toISOString();
  return new Date(value).toISOString();
}

export default function FeaturePage({ config }) {
  const { endpoint, title, fields } = config;
  const detailFields = config.detailFields || fields;
  const base = `/records/${endpoint}`;
  const [items, setItems] = useState([]), [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [capabilities, setCapabilities] = useState({}), [selected, setSelected] = useState(null), [detailCapabilities, setDetailCapabilities] = useState({});
  const [editing, setEditing] = useState(false), [creating, setCreating] = useState(false), [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({}), [exampleApplied, setExampleApplied] = useState(false);
  const [loading, setLoading] = useState(true), [opening, setOpening] = useState(false), [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState('');
  const pending = useRef({ list: null, detail: null, action: null });
  const editableFields = (creating ? capabilities.editableFields : detailCapabilities.editableFields) || fields;
  const examples = recordExamples(config);

  const loadItems = useCallback(async (page = 1) => {
    pending.current.list?.abort();
    const controller = new AbortController(); pending.current.list = controller;
    setLoading(true); setLoadError('');
    try {
      const response = await api.get(base, { params: { page, limit: 20 }, signal: controller.signal });
      const result = recordList(response, page);
      if (pending.current.list !== controller || controller.signal.aborted) return;
      setItems(result.items); setPagination(result.pagination); setCapabilities(result.capabilities);
    } catch (failure) {
      if (pending.current.list === controller && !isCancelled(failure, controller.signal)) setLoadError(requestError(failure, `Could not load ${title}`));
    } finally { if (pending.current.list === controller) { pending.current.list = null; setLoading(false); } }
  }, [base, title]);

  useEffect(() => {
    setItems([]); setPagination({ page: 1, total: 0, totalPages: 1 }); setSelected(null); setCreating(false); setEditing(false); setDeleting(false); setError(''); setMessage(''); setCapabilities({});
    loadItems(1);
    return () => { for (const request of Object.values(pending.current)) request?.abort(); pending.current = { list: null, detail: null, action: null }; };
  }, [loadItems]);

  const close = () => {
    pending.current.detail?.abort(); pending.current.action?.abort();
    const actionWasPending = Boolean(pending.current.action);
    pending.current.detail = null; pending.current.action = null;
    setOpening(false); setSaving(false); setSelected(null); setCreating(false); setEditing(false); setDeleting(false); setError('');
    if (actionWasPending) { setMessage('Request cancelled. The record list is being refreshed to confirm the server state.'); loadItems(pagination.page); }
  };

  const selectItem = async id => {
    pending.current.detail?.abort();
    const controller = new AbortController(); pending.current.detail = controller;
    setOpening(true); setError('');
    try {
      const response = await api.get(`${base}/${encodeURIComponent(id)}`, { signal: controller.signal });
      const result = recordDetail(response);
      if (pending.current.detail !== controller || controller.signal.aborted) return;
      setSelected(result.item); setDetailCapabilities(result.capabilities); setEditing(false); setCreating(false); setDeleting(false);
    } catch (failure) {
      if (pending.current.detail === controller && !isCancelled(failure, controller.signal)) setError(requestError(failure, 'Could not open the record'));
    } finally { if (pending.current.detail === controller) { pending.current.detail = null; setOpening(false); } }
  };

  const startCreate = () => {
    if (!capabilities.canCreate) return;
    setFormData(Object.fromEntries(fields.map(field => [field, booleanFields.includes(field) ? false : ''])));
    setSelected(null); setCreating(true); setEditing(false); setDeleting(false); setExampleApplied(false); setError('');
  };
  const startEdit = () => {
    if (!detailCapabilities.canEdit || !selected) return;
    setFormData(Object.fromEntries(fields.map(field => [field, field === 'date' ? localTimestamp(selected[field]) : dateFields.includes(field) && selected[field] ? String(selected[field]).slice(0, 10) : selected[field] ?? (booleanFields.includes(field) ? false : '')])));
    setCreating(false); setEditing(true); setDeleting(false); setExampleApplied(Boolean(demoLabel(selected))); setError('');
  };
  const save = async event => {
    event.preventDefault();
    if (pending.current.action || !(creating ? capabilities.canCreate : detailCapabilities.canEdit)) return;
    const controller = new AbortController(); pending.current.action = controller; setSaving(true); setError('');
    try {
      const values = Object.fromEntries(editableFields.filter(field => fields.includes(field)).map(field => [field, numericFields.includes(field) ? (formData[field] === '' ? null : Number(formData[field])) : field === 'date' ? savedTimestamp(formData[field], selected?.date) : dateFields.includes(field) ? formData[field] || null : formData[field]]));
      const payload = { ...values, ...(creating && (exampleApplied || config.sampleOnly) ? { is_demo: true } : {}), ...(selected?.record_version ? { recordVersion: selected.record_version } : {}) };
      const response = creating ? await api.post(base, payload, { signal: controller.signal }) : await api.put(`${base}/${selected.id}`, payload, { signal: controller.signal });
      const result = recordDetail(response);
      if (pending.current.action !== controller || controller.signal.aborted) return;
      setSelected(result.item); setDetailCapabilities(result.capabilities); setCreating(false); setEditing(false); setMessage('Record saved to PostgreSQL.');
      await loadItems(pagination.page);
    } catch (failure) { if (pending.current.action === controller && !isCancelled(failure, controller.signal)) setError(requestError(failure, 'Could not save the record')); }
    finally { if (pending.current.action === controller) { pending.current.action = null; setSaving(false); } }
  };
  const remove = async () => {
    if (!selected || !detailCapabilities.canDelete || pending.current.action) return;
    const controller = new AbortController(); pending.current.action = controller; setSaving(true); setError('');
    try {
      await api.delete(`${base}/${selected.id}`, { data: selected.record_version ? { recordVersion: selected.record_version } : undefined, signal: controller.signal });
      if (pending.current.action !== controller || controller.signal.aborted) return;
      setSelected(null); setDeleting(false); setMessage('Record deleted from PostgreSQL.'); await loadItems(pagination.page);
    } catch (failure) { if (pending.current.action === controller && !isCancelled(failure, controller.signal)) setError(requestError(failure, 'Could not delete the record')); }
    finally { if (pending.current.action === controller) { pending.current.action = null; setSaving(false); } }
  };

  const formatField = (field, value) => {
    if (value === null || value === undefined || value === '') return 'Not supplied';
    if (typeof value === 'object') return reportText(value);
    return formatValue(field, value);
  };
  const dialogTitle = deleting ? 'Delete this record?' : creating ? `New ${title}` : editing ? `Edit ${getDisplayName(selected, fields)}` : selected ? getDisplayName(selected, fields) : '';

  return <section className="max-w-6xl mx-auto fade-in">
    <header className="flex items-start justify-between gap-4 mb-5 flex-wrap"><div><h1 className="text-2xl font-bold text-gray-800">{title}</h1><p className="text-gray-500 text-sm mt-1">{loading ? 'Loading saved records…' : loadError ? 'Records could not be refreshed. Any visible entries are from the previous successful load.' : `${pagination.total} saved records · PostgreSQL`}</p></div><div className="flex gap-2"><button type="button" className="btn btn-secondary" onClick={() => loadItems(pagination.page)} disabled={loading}>Refresh</button><button type="button" className="btn btn-primary" onClick={startCreate} disabled={loading || Boolean(loadError) || !capabilities.canCreate}><Plus size={16}/> New Item</button></div></header>
    <p className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 mb-4">{config.description || 'Synthetic demo records are labeled and are not case evidence, verified law, a filed document, a court decision or an AI provider receipt. Real records retain their native access and evidence restrictions.'}</p>
    {loadError && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"><p>{loadError}</p><button type="button" className="underline mt-2" onClick={() => loadItems(pagination.page)}>Retry loading records</button></div>}
    {error && !selected && !creating && <div role="alert" className="ai-alert mb-4">{error}</div>}
    {message && <p role="status" className="text-sm text-blue-700 mb-4">{message}</p>}
    {opening && <div role="status" className="flex gap-3 items-center mb-4"><Loader2 size={18} className="animate-spin"/> Opening saved record…<button type="button" className="underline" onClick={close}>Cancel</button></div>}
    {loading ? <div role="status" className="flex items-center justify-center gap-3 h-48"><Loader2 className="animate-spin text-blue-500" size={28}/> Loading saved records</div> : !loadError && items.length === 0 ? <div className="bg-white rounded-xl border p-8 text-center"><h2 className="font-semibold text-gray-700">No saved records</h2><p className="text-gray-500 mt-2">No records were returned for your account. Use the configured native demo-data setup or create an authorized draft.</p></div> : items.length > 0 ? <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">Record</th><th className="px-4 py-3">Type / status</th><th className="px-4 py-3">Data classification</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3">Open</th></tr></thead><tbody className="divide-y">{items.map(item => <tr key={item.id} className="hover:bg-blue-50/40"><td className="px-4 py-3"><button type="button" className="text-blue-700 font-semibold text-left hover:underline" onClick={() => selectItem(item.id)}>{getDisplayName(item, fields)}</button></td><td className="px-4 py-3">{getSubtext(item) || 'Draft record'}</td><td className="px-4 py-3">{demoLabel(item) || 'Account record · verification not implied'}</td><td className="px-4 py-3">{item.updated_at || item.created_at ? new Date(item.updated_at || item.created_at).toLocaleDateString() : 'Not supplied'}</td><td className="px-4 py-3"><button type="button" className="text-blue-700 hover:underline" aria-label={`Open ${getDisplayName(item, fields)}`} onClick={() => selectItem(item.id)}>View</button></td></tr>)}</tbody></table></div> : null}
    {!loading && !loadError && pagination.totalPages > 1 && <nav aria-label="Record pages" className="flex items-center justify-between gap-4 mt-4"><button type="button" className="btn btn-secondary" disabled={pagination.page <= 1} onClick={() => loadItems(pagination.page - 1)}>Previous</button><span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span><button type="button" className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => loadItems(pagination.page + 1)}>Next</button></nav>}
    {(selected || creating) && <Modal title={dialogTitle} className="ai-workspace-dialog" onClose={close} footer={<><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>{!creating && !editing && !deleting && <><button type="button" className="btn btn-secondary" disabled={!detailCapabilities.canEdit || saving} onClick={startEdit}>Edit</button><button type="button" className="btn btn-danger" disabled={!detailCapabilities.canDelete || saving} onClick={() => setDeleting(true)}>Delete</button></>}{deleting && <button type="button" className="btn btn-danger" disabled={saving || !detailCapabilities.canDelete} onClick={remove}>{saving ? 'Deleting…' : 'Confirm delete'}</button>}{(editing || creating) && <button type="submit" form="native-record-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>}</>}>
      {error && <div role="alert" className="ai-alert">{error}</div>}
      {(demoLabel(selected) || exampleApplied) && <p className="bg-amber-50 rounded p-3 text-amber-900 mb-4">{demoLabel(selected) || 'Synthetic demo draft · not case evidence'}</p>}
      {detailCapabilities.retainedReason && <p className="ai-muted mb-4">{detailCapabilities.retainedReason}</p>}
      {deleting ? <p>Delete this saved draft from your account? Retained evidence and finalized records cannot be deleted through these controls.</p> : editing || creating ? <form id="native-record-form" onSubmit={save} className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4"><p className="font-semibold text-blue-900">Demo record examples</p><p className="text-sm text-blue-800 mt-1">Each button fills the native draft inputs, including optional planning fields. No request is sent; save only after review. Linked case IDs must identify actual saved records and stay manual. Existing evidence and immutable fields stay protected.</p><div className="flex flex-wrap gap-2 mt-3">{examples.map(example => <button type="button" key={example.label} className="btn btn-secondary" disabled={saving || (!creating && !demoLabel(selected))} onClick={() => { setFormData({ ...formData, ...Object.fromEntries(Object.entries(example.values).filter(([key]) => editableFields.includes(key))) }); setExampleApplied(true); setError(''); }}>{example.label}</button>)}</div></div>
        {fields.map(field => <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`record-${field}`}>{fieldLabels[field] || readableLabel(field)}</label>{booleanFields.includes(field) ? <select id={`record-${field}`} value={formData[field] ? 'true' : 'false'} disabled={saving || !editableFields.includes(field)} onChange={event => setFormData({ ...formData, [field]: event.target.value === 'true' })} className="w-full px-3 py-2 border rounded-lg"><option value="false">No</option><option value="true">Yes</option></select> : textareaFields.includes(field) ? <textarea id={`record-${field}`} rows={3} disabled={saving || !editableFields.includes(field)} value={formData[field] ?? ''} onChange={event => setFormData({ ...formData, [field]: event.target.value })} className="w-full px-3 py-2 border rounded-lg resize-y"/> : <input id={`record-${field}`} type={field === 'date' ? 'datetime-local' : dateFields.includes(field) ? 'date' : numericFields.includes(field) ? 'number' : 'text'} step={field === 'date' || numericFields.includes(field) ? 'any' : undefined} disabled={saving || !editableFields.includes(field)} value={formData[field] ?? ''} onChange={event => setFormData({ ...formData, [field]: event.target.value })} className="w-full px-3 py-2 border rounded-lg"/>}{field === 'date' && <p className="text-xs text-gray-500 mt-1">Times use your browser's time zone. Planning examples are not verified court dates.</p>}</div>)}
      </form> : <><dl className="grid grid-cols-1 md:grid-cols-2 gap-4">{detailFields.map(field => <div key={field} className="bg-gray-50 rounded-lg p-4"><dt className="text-xs text-gray-500 uppercase mb-1">{fieldLabels[field] || readableLabel(field)}</dt><dd className="text-gray-800 whitespace-pre-wrap break-words">{formatField(field, selected[field])}</dd></div>)}</dl>{(selected.ai_analysis || selected.ai_results != null) && <AIReport response={selected.ai_results ?? selected.ai_analysis} title="Stored advisory text" sourceLabel="Stored text · provider provenance not verified"/>}<p className="text-sm text-gray-500 border-t pt-4 mt-4">Direct model predictions and legacy legal actions remain outside this record-management boundary. Use the supported advisory report workspace for a separately requested OpenRouter response; an example record is not a generated report.</p></>}
    </Modal>}
  </section>;
}
