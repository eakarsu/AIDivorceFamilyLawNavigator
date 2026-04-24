import { useState, useEffect } from 'react';
import api from '../services/api';
import AIResponseDisplay from '../components/AIResponseDisplay';
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

  useEffect(() => {
    api.get('/ai-center/features').then(res => setFeatures(res.data));
  }, []);

  const handleQuery = async () => {
    if (!prompt.trim() || !selected) return;
    setLoading(true);
    try {
      const res = await api.post('/ai-center/query', {
        featureId: selected.id,
        prompt: prompt.trim(),
      });
      setResponse(res.data.response);
      setHistory(prev => [...prev, { feature: selected.name, prompt: prompt.trim(), response: res.data.response }]);
      setPrompt('');
    } catch (err) {
      setResponse('Error: ' + (err.response?.data?.error || 'Failed to get AI response. Check your API key.'));
    } finally {
      setLoading(false);
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

  if (selected) {
    const Icon = iconMap[selected.icon] || Sparkles;
    return (
      <div className="max-w-4xl mx-auto fade-in">
        <button
          onClick={() => { setSelected(null); setResponse(''); }}
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

        {/* Query Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Ask your question</label>
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your situation or ask a question..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleQuery(); }}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPrompt(suggestedPrompts[selected.id] || '')}
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
                  <><Send size={16} /> Ask AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Response */}
        {response && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 fade-in">
            <AIResponseDisplay content={response} />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Previous Queries</h3>
            {history.slice().reverse().slice(1).map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">{item.feature}</span>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-3 bg-gray-50 rounded-lg p-3">{item.prompt}</p>
                <AIResponseDisplay content={item.response} />
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
          Select any AI tool below to get instant, intelligent guidance on your family law matters.
          All responses are powered by advanced AI and tailored to your specific situation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(feature => {
          const Icon = iconMap[feature.icon] || Sparkles;
          return (
            <button
              key={feature.id}
              onClick={() => setSelected(feature)}
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
      </div>
    </div>
  );
}
