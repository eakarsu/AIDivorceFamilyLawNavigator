import { useState } from 'react';
import api from '../services/api';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { Sparkles, Loader2, Target, Users, FileText, Map, MessageSquare, Search, PenTool, Gavel } from 'lucide-react';

const TABS = [
  { id: 'predict-trial-outcome', label: 'Trial Outcome Prediction', Icon: Target },
  { id: 'predict-custody-outcome', label: 'Custody Outcome Prediction', Icon: Users },
  { id: 'draft-documents', label: 'AI Document Drafter', Icon: FileText },
  { id: 'state-aware-guidance', label: 'State-Aware Guidance', Icon: Map },
  { id: 'coparenting-message-coach', label: 'Co-parenting Message Coach', Icon: MessageSquare },
  { id: 'legal-research-search', label: 'Legal Research', Icon: Search },
  { id: 'esign-request', label: 'E-signature Request', Icon: PenTool },
  { id: 'court-filing-submit', label: 'Court Filing', Icon: Gavel },
];

export default function PredictiveAIPage() {
  const [tab, setTab] = useState(TABS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // shared form state
  const [trial, setTrial] = useState({ case_facts: '', jurisdiction: '', parties: '', claims: '' });
  const [custody, setCustody] = useState({ case_id: '', custody_facts: '', jurisdiction: '', child_factors: '' });
  const [draft, setDraft] = useState({ document_type: '', parties: '', jurisdiction: '', facts: '' });
  const [stateGuide, setStateGuide] = useState({ state: '', topic: 'divorce-process', facts: '' });
  const [coachMsg, setCoachMsg] = useState({ draft: '', audience: 'co-parent', tone: 'neutral, calm, child-focused' });
  const [research, setResearch] = useState({ query: '', jurisdiction: '' });
  const [esign, setEsign] = useState({ document_id: '', signers: '' });
  const [filing, setFiling] = useState({ document_id: '', jurisdiction: '' });

  const submit = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      let payload = {};
      if (tab === 'predict-trial-outcome') payload = trial;
      else if (tab === 'predict-custody-outcome') payload = custody;
      else if (tab === 'draft-documents') payload = draft;
      else if (tab === 'state-aware-guidance') payload = stateGuide;
      else if (tab === 'coparenting-message-coach') payload = coachMsg;
      else if (tab === 'legal-research-search') payload = research;
      else if (tab === 'esign-request') payload = esign;
      else if (tab === 'court-filing-submit') payload = filing;

      const res = await api.post(`/ai/${tab}`, payload);
      setResult(res.data);
    } catch (e) {
      if (e.response?.status === 503) {
        const missing = e.response?.data?.missing;
        setError((e.response?.data?.error || 'Service not configured') + (missing ? ` (missing: ${missing})` : ''));
      } else {
        setError(e.response?.data?.error || 'Request failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  const renderForm = () => {
    if (tab === 'predict-trial-outcome') {
      return (
        <>
          <label className="block text-sm font-semibold mb-1">Case Facts *</label>
          <textarea rows={5} value={trial.case_facts} onChange={(e) => setTrial({ ...trial, case_facts: e.target.value })} className="w-full px-3 py-2 border rounded mb-3 resize-y" placeholder="Describe the relevant facts of the case..." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={trial.jurisdiction} onChange={(e) => setTrial({ ...trial, jurisdiction: e.target.value })} placeholder="Jurisdiction (e.g., California)" className="px-3 py-2 border rounded" />
            <input value={trial.parties} onChange={(e) => setTrial({ ...trial, parties: e.target.value })} placeholder="Parties involved" className="px-3 py-2 border rounded" />
            <input value={trial.claims} onChange={(e) => setTrial({ ...trial, claims: e.target.value })} placeholder="Claims at issue" className="px-3 py-2 border rounded" />
          </div>
        </>
      );
    }
    if (tab === 'predict-custody-outcome') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input value={custody.case_id} onChange={(e) => setCustody({ ...custody, case_id: e.target.value })} placeholder="Case ID (optional)" className="px-3 py-2 border rounded" />
            <input value={custody.jurisdiction} onChange={(e) => setCustody({ ...custody, jurisdiction: e.target.value })} placeholder="Jurisdiction" className="px-3 py-2 border rounded" />
          </div>
          <label className="block text-sm font-semibold mb-1">Custody Facts</label>
          <textarea rows={4} value={custody.custody_facts} onChange={(e) => setCustody({ ...custody, custody_facts: e.target.value })} className="w-full px-3 py-2 border rounded mb-3 resize-y" placeholder="Living situation, parenting history, work schedules..." />
          <label className="block text-sm font-semibold mb-1">Child Factors</label>
          <textarea rows={3} value={custody.child_factors} onChange={(e) => setCustody({ ...custody, child_factors: e.target.value })} className="w-full px-3 py-2 border rounded mb-3 resize-y" placeholder="Child's age, school, special needs, preferences..." />
        </>
      );
    }
    if (tab === 'draft-documents') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input value={draft.document_type} onChange={(e) => setDraft({ ...draft, document_type: e.target.value })} placeholder="Document type (e.g., Marital Settlement Agreement) *" className="px-3 py-2 border rounded" />
            <input value={draft.jurisdiction} onChange={(e) => setDraft({ ...draft, jurisdiction: e.target.value })} placeholder="Jurisdiction" className="px-3 py-2 border rounded" />
          </div>
          <input value={draft.parties} onChange={(e) => setDraft({ ...draft, parties: e.target.value })} placeholder="Parties (e.g., John Doe and Jane Doe)" className="w-full px-3 py-2 border rounded mb-3" />
          <label className="block text-sm font-semibold mb-1">Facts / Terms</label>
          <textarea rows={5} value={draft.facts} onChange={(e) => setDraft({ ...draft, facts: e.target.value })} className="w-full px-3 py-2 border rounded mb-3 resize-y" placeholder="Key facts, terms to include..." />
        </>
      );
    }
    if (tab === 'state-aware-guidance') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input value={stateGuide.state} onChange={(e) => setStateGuide({ ...stateGuide, state: e.target.value })} placeholder="U.S. State (e.g., California)" className="px-3 py-2 border rounded" />
            <select value={stateGuide.topic} onChange={(e) => setStateGuide({ ...stateGuide, topic: e.target.value })} className="px-3 py-2 border rounded">
              <option value="divorce-process">Divorce Process</option>
              <option value="child-support">Child Support</option>
              <option value="alimony">Alimony</option>
              <option value="custody">Custody</option>
              <option value="property">Property Division</option>
            </select>
          </div>
          <label className="block text-sm font-semibold mb-1">Your Facts</label>
          <textarea rows={4} value={stateGuide.facts} onChange={(e) => setStateGuide({ ...stateGuide, facts: e.target.value })} className="w-full px-3 py-2 border rounded mb-3 resize-y" placeholder="Marriage length, income, kids, residence..." />
        </>
      );
    }
    if (tab === 'coparenting-message-coach') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input value={coachMsg.audience} onChange={(e) => setCoachMsg({ ...coachMsg, audience: e.target.value })} placeholder="Audience" className="px-3 py-2 border rounded" />
            <input value={coachMsg.tone} onChange={(e) => setCoachMsg({ ...coachMsg, tone: e.target.value })} placeholder="Desired tone" className="px-3 py-2 border rounded" />
          </div>
          <label className="block text-sm font-semibold mb-1">Draft Message *</label>
          <textarea rows={5} value={coachMsg.draft} onChange={(e) => setCoachMsg({ ...coachMsg, draft: e.target.value })} className="w-full px-3 py-2 border rounded mb-3 resize-y" placeholder="Paste your draft message here..." />
        </>
      );
    }
    if (tab === 'legal-research-search') {
      return (
        <>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded mb-3">Requires LEXIS_API_KEY or WESTLAW_API_KEY env var.</div>
          <input value={research.jurisdiction} onChange={(e) => setResearch({ ...research, jurisdiction: e.target.value })} placeholder="Jurisdiction" className="w-full px-3 py-2 border rounded mb-3" />
          <input value={research.query} onChange={(e) => setResearch({ ...research, query: e.target.value })} placeholder="Search query (e.g., 'spousal support modification standards')" className="w-full px-3 py-2 border rounded mb-3" />
        </>
      );
    }
    if (tab === 'esign-request') {
      return (
        <>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded mb-3">Requires DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID env vars.</div>
          <input value={esign.document_id} onChange={(e) => setEsign({ ...esign, document_id: e.target.value })} placeholder="Document ID" className="w-full px-3 py-2 border rounded mb-3" />
          <input value={esign.signers} onChange={(e) => setEsign({ ...esign, signers: e.target.value })} placeholder="Signer emails (comma-separated)" className="w-full px-3 py-2 border rounded mb-3" />
        </>
      );
    }
    if (tab === 'court-filing-submit') {
      return (
        <>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded mb-3">Requires COURT_EFILE_API_KEY env var. Per-jurisdiction wiring stubbed.</div>
          <input value={filing.document_id} onChange={(e) => setFiling({ ...filing, document_id: e.target.value })} placeholder="Document ID" className="w-full px-3 py-2 border rounded mb-3" />
          <input value={filing.jurisdiction} onChange={(e) => setFiling({ ...filing, jurisdiction: e.target.value })} placeholder="Jurisdiction (e.g., NY-NYC-Civil)" className="w-full px-3 py-2 border rounded mb-3" />
        </>
      );
    }
    return null;
  };

  const renderResult = () => {
    if (!result) return null;
    if (tab === 'draft-documents') {
      return <AIResponseDisplay content={result.draft || ''} />;
    }
    if (result.prediction?.raw) {
      return <AIResponseDisplay content={result.prediction.raw} />;
    }
    if (tab === 'state-aware-guidance' && result.guidance?.raw) {
      return <AIResponseDisplay content={result.guidance.raw} />;
    }
    if (tab === 'coparenting-message-coach' && result.coaching?.raw) {
      return <AIResponseDisplay content={result.coaching.raw} />;
    }
    return (
      <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">{JSON.stringify(result.prediction || result.guidance || result.coaching || result, null, 2)}</pre>
    );
  };

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Predictive AI Tools</h2>
            <p className="text-blue-100 text-sm">Trial &amp; custody outcome forecasts and AI document drafting</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => {
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(null); setError(''); }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${tab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
        {renderForm()}
        <button
          onClick={submit}
          disabled={busy}
          className="mt-3 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Run AI
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {renderResult()}
        </div>
      )}
    </div>
  );
}
