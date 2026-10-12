import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import FormattedAIReport from '../components/FormattedAIReport';
import { requestError, isCancelled } from '../services/recordData';
import {
  Sparkles, Send, Loader2, Scale, FileSearch, Users, DollarSign,
  Handshake, MessageCircle, Building, Calculator, Calendar, BookOpen,
  Heart, FileText, Shield, Home, Target, Bot, ArrowLeft
} from 'lucide-react';

const iconMap = {
  Scale, FileSearch, Users, DollarSign, Handshake, MessageCircle,
  Building, Calculator, Calendar, BookOpen, Heart, FileText, Shield, Home, Target
};

export default function AICenter() {
  const [features, setFeatures] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [featureError, setFeatureError] = useState('');
  const [featureLoading, setFeatureLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const active = useRef(null);
  const featureRequest = useRef(null);
  const alive = useRef(true);

  const loadFeatures = useCallback(async () => {
    featureRequest.current?.abort();
    const controller = new AbortController(); featureRequest.current = controller;
    setFeatureLoading(true); setFeatureError('');
    try {
      const res = await api.get('/ai-center/features', { signal: controller.signal });
      if (!Array.isArray(res.data)) throw new Error('The server returned an invalid AI tool catalog.');
      if (!controller.signal.aborted && featureRequest.current === controller) setFeatures(res.data);
    } catch (err) {
      if (featureRequest.current === controller && !isCancelled(err, controller.signal)) setFeatureError(requestError(err, 'Could not load AI tools'));
    } finally {
      if (featureRequest.current === controller) { featureRequest.current = null; setFeatureLoading(false); }
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    loadFeatures();
    return () => { alive.current = false; featureRequest.current?.abort(); featureRequest.current = null; active.current?.abort(); active.current = null; };
  }, [loadFeatures]);

  const cancel = () => {
    active.current?.abort(); active.current = null; setLoading(false);
    setNotice('Request cancelled. Any late response will be ignored.');
  };
  const handleQuery = async () => {
    if (!prompt.trim() || !selected || active.current) return;
    const controller = new AbortController(), submittedPrompt = prompt.trim(), feature = selected;
    active.current = controller; setLoading(true); setError(''); setResponse('');
    try {
      const res = await api.post('/ai-center/query', { featureId: feature.id, prompt: submittedPrompt }, { signal: controller.signal });
      if (alive.current && active.current === controller && !controller.signal.aborted) {
        setResponse(res.data.response);
        setHistory(prev => [...prev, { feature: feature.name, prompt: submittedPrompt, response: res.data.response, createdAt: new Date().toISOString() }]);
      }
    } catch (err) {
      if (alive.current && active.current === controller && !isCancelled(err, controller.signal)) setError(requestError(err, 'Failed to get an AI response'));
    } finally {
      if (alive.current && active.current === controller) { active.current = null; setLoading(false); }
    }
  };

  const suggestedPrompts = {
    'legal-advisor': 'What are my rights regarding property division in a community property state?',
    'document-review': 'What should I look for when reviewing a marital settlement agreement?',
    'custody-advisor': 'What factors do courts consider when determining the best interests of the child?',
    'financial-analyzer': 'How should I prepare financially for a divorce with significant assets?',
    'settlement-evaluator': 'What are the key elements that make a settlement agreement fair and enforceable?',
    'mediation-coach': 'How should I prepare for my first mediation session in a custody dispute?',
    'asset-classifier': 'How do I determine if a business started during marriage is marital property?',
    'support-calculator': 'What factors affect child support calculations in California?',
    'timeline-planner': 'What is the typical timeline for an uncontested divorce in California?',
    'legal-term-explainer': 'Explain the difference between legal custody and physical custody.',
    'parenting-plan-advisor': 'What should a comprehensive parenting plan include for school-age children?',
    'filing-guide': 'What documents do I need to file for divorce in California?',
    'emotional-support': 'What are healthy coping strategies during a difficult divorce?',
    'property-advisor': 'How is a family home typically handled in divorce proceedings?',
    'negotiation-coach': 'What negotiation strategies work best for reaching a custody agreement?',
  };

  const example = (feature, variant = 0) => {
    const question = suggestedPrompts[feature.id] || `Help review ${feature.name} for a fictional family-law planning exercise.`;
    const contexts = [
      'Fictional planning example: California; a married couple is preparing an uncontested separation, with one school-age child, a jointly owned home, retirement savings and a mortgage. No court order or reviewed source document has been provided.',
      'Fictional detailed example: New York; two parents are preparing mediation after a ten-year marriage, with two school-age children, variable work schedules, joint savings and a shared home. They want a workable parenting schedule and a documented financial review. No reviewed evidence or legal determination has been supplied.',
      'Fictional concise example: Texas; a couple wants to understand a proposed separation agreement, shared housing obligations and co-parenting communication. All facts are illustrative; local rules and actual financial documents still need review.'
    ];
    return `${contexts[variant]}\n\nQuestion: ${question}\n\nRequested output: ${['a clear planning checklist with questions to resolve', 'a detailed comparison with assumptions, options and next steps', 'a brief plain-language summary and five practical next steps'][variant]}. Identify missing information, distinguish examples from verified facts, and do not invent legal citations or court decisions.`;
  };
  const fill = (variant) => {
    if (loading || !selected) return;
    setPrompt(example(selected, variant)); setResponse(''); setError('');
    setNotice('Demo AI filled the complete question. Review it before generating; no AI request was sent.');
  };

  if (selected) {
    const Icon = iconMap[selected.icon] || Sparkles;
    return (
      <div className="max-w-4xl mx-auto fade-in">
        <button
          disabled={loading}
          onClick={() => { setSelected(null); setResponse(''); setError(''); }}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition"
        >
          <ArrowLeft size={18} /> Back to AI Center
        </button>

        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <p className="text-blue-100 text-sm">{selected.description}</p>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</p>}
        {notice && <p role="status" className="text-sm text-blue-800 mb-4">{notice}</p>}
        <section aria-label="Complete AI examples" className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4"><strong>Fill all AI fields</strong><p className="text-sm mt-1">Each button fills the complete question with a fictional example. Generate separately after review.</p><div className="flex flex-wrap gap-2 mt-3">{['Demo AI · planning','Demo AI · detailed','Demo AI · concise'].map((label,index) => <button type="button" key={label} disabled={loading} onClick={() => fill(index)} className="btn btn-secondary">{label}</button>)}</div></section>
        {/* Query Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Ask your question</label>
          <div className="space-y-3">
            <textarea
              aria-label="Ask your question"
              disabled={loading}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your situation or ask a question..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleQuery(); }}
            />
            <div className="flex items-center justify-between">
              <button
                disabled={loading}
                onClick={() => fill(0)}
                className="text-sm text-blue-500 hover:text-blue-700 transition"
              >
                Try a suggested prompt
              </button>
              <button
                onClick={handleQuery}
                disabled={loading || !prompt.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${
                  loading
                    ? 'bg-blue-100 text-blue-400 ai-loading'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md disabled:opacity-50'
                }`}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Thinking...</>
                ) : (
                  <><Send size={16} /> Generate with OpenRouter</>
                )}
              </button>
              <button type="button" disabled={!loading} onClick={cancel} className="btn btn-secondary">Cancel request</button>
            </div>
          </div>
        </div>

        {/* Response */}
        {response && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 fade-in">
            <FormattedAIReport title={selected.name} response={response} />
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Previous queries this session</h3>
            {history.slice().reverse().slice(1).map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">{item.feature}</span>
                  <time className="text-xs text-gray-500" dateTime={item.createdAt}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Time not recorded'}</time>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-3 bg-gray-50 rounded-lg p-3">{item.prompt}</p>
                <FormattedAIReport title={item.feature} response={item.response} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Center</h1>
            <p className="text-blue-100">Your comprehensive AI-powered legal assistant hub</p>
          </div>
        </div>
        <p className="text-blue-200 text-sm mt-2 max-w-2xl">
          Select a tool, review the fictional example, then request an OpenRouter advisory response.
          Responses require human review and are not legal advice, verified law, a court decision, or an executed action.
        </p>
      </div>

      {featureLoading && <p role="status" className="bg-white border rounded-lg p-4 text-gray-600 mb-4"><Loader2 size={18} className="inline animate-spin mr-2"/>Loading AI tools…</p>}
      {featureError && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4"><p>{featureError}</p><button type="button" onClick={loadFeatures} className="btn btn-secondary mt-3">Retry loading AI tools</button></div>}
      {!featureLoading && !featureError && features.length === 0 && <div className="bg-white border rounded-lg p-5 text-gray-600 mb-4"><p>No AI tools were returned by the configured server.</p><button type="button" onClick={loadFeatures} className="btn btn-secondary mt-3">Retry loading AI tools</button></div>}
      {!featureLoading && !featureError && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(feature => {
          const Icon = iconMap[feature.icon] || Sparkles;
          return (
            <button
              key={feature.id}
              onClick={() => { setSelected(feature); setPrompt(example(feature)); setResponse(''); setError(''); setNotice('A complete fictional example is loaded. Review before generating.'); }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-left group border border-gray-100 hover:border-purple-200 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition">
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-purple-600 transition">
                {feature.name}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              <div className="flex items-center gap-1 mt-3 text-purple-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                <Sparkles size={14} /> Start AI Chat
              </div>
            </button>
          );
        })}
      </div>}
    </div>
  );
}
