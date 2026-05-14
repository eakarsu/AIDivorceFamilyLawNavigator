import { useEffect, useState } from 'react';
import api from '../services/api';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { Map, Sparkles, Loader2 } from 'lucide-react';

export default function StateLawPage() {
  const [states, setStates] = useState([]);
  const [selected, setSelected] = useState('CA');
  const [situation, setSituation] = useState('');
  const [advice, setAdvice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/state-law').then((r) => setStates(r.data?.data || [])).catch(() => {});
  }, []);

  const fact = states.find((s) => s.state_code === selected);

  const advise = async () => {
    if (!situation.trim()) return;
    setBusy(true); setError(''); setAdvice(null);
    try {
      const r = await api.post('/state-law/advise', { state: selected, situation });
      setAdvice(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Map className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">State-Specific Legal Engine</h1>
          <p className="text-gray-500 text-sm">Select your state. AI is augmented with cached statutes for accurate guidance.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Choose State</h3>
          <select className="w-full px-3 py-2 border rounded mb-3" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {states.map((s) => <option key={s.state_code} value={s.state_code}>{s.state_code}</option>)}
          </select>
          {fact && (
            <div className="text-sm space-y-2 bg-gray-50 rounded p-3">
              <div><strong>Property Regime:</strong> {fact.property_regime}</div>
              <div><strong>Waiting Period:</strong> {fact.mandatory_waiting_period_days} days</div>
              <div><strong>Residency:</strong> {fact.residency_requirement_months} months</div>
              <div><strong>Notes:</strong> {fact.notes}</div>
              <div className="text-xs text-gray-500"><strong>Source:</strong> {fact.source}</div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Describe your situation</h3>
          <textarea rows={5} value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full px-3 py-2 border rounded resize-y" placeholder="E.g., I've been married 12 years; we have one minor child; I'm contemplating filing for divorce in my state..."></textarea>
          <button onClick={advise} disabled={busy || !situation.trim()} className="mt-3 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Get State-Specific Advice
          </button>

          {advice && (
            <div className="mt-4 border-t pt-4">
              <AIResponseDisplay content={advice.ai_analysis} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
