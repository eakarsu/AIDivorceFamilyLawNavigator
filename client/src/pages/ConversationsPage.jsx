import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { MessageSquare, Send, Plus, Trash2, Loader2 } from 'lucide-react';

export default function ConversationsPage() {
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.get('/conversations');
      setList(r.data?.data || []);
    } catch (_) { setError('Failed to load conversations'); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active]);

  const open = async (id) => {
    try {
      const r = await api.get(`/conversations/${id}`);
      setActive(r.data);
    } catch (_) { setError('Failed to open'); }
  };

  const create = async () => {
    if (!title.trim()) return;
    try {
      const r = await api.post('/conversations', { title });
      setTitle('');
      load();
      open(r.data.id);
    } catch (e) {
      setError(e.response?.data?.error || 'Create failed');
    }
  };

  const send = async () => {
    if (!draft.trim() || !active) return;
    setBusy(true); setError('');
    try {
      const r = await api.post(`/conversations/${active.id}/message`, { content: draft });
      setActive(r.data.conversation);
      setDraft('');
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Send failed');
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/conversations/${id}`);
      if (active?.id === id) setActive(null);
      load();
    } catch (_) { setError('Delete failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Multi-Turn Case Advisor</h1>
          <p className="text-gray-500 text-sm">Ongoing chat that remembers your case context across turns.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="p-3 border-b">
            <div className="flex gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New thread title..." className="flex-1 px-2 py-1.5 border rounded text-sm" />
              <button onClick={create} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-1"><Plus size={14} /> New</button>
            </div>
          </div>
          <div className="divide-y max-h-[60vh] overflow-y-auto">
            {list.map((c) => (
              <button key={c.id} onClick={() => open(c.id)} className={`w-full p-3 text-left hover:bg-blue-50/50 ${active?.id === c.id ? 'bg-blue-50' : ''}`}>
                <div className="font-medium text-sm truncate">{c.title}</div>
                <div className="text-xs text-gray-500">{c.message_count} msgs · {new Date(c.updated_at).toLocaleDateString()}</div>
                <span onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="text-red-400 hover:text-red-600 text-xs"><Trash2 size={12} /></span>
              </button>
            ))}
            {list.length === 0 && <div className="p-3 text-sm text-gray-400">No conversations yet.</div>}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col" style={{ height: '70vh' }}>
          {active ? (
            <>
              <div className="p-3 border-b font-semibold">{active.title}</div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {(active.messages || []).map((m, i) => (
                  <div key={i} className={`max-w-[80%] p-3 rounded-lg ${m.role === 'assistant' ? 'bg-white border' : 'bg-blue-600 text-white ml-auto'}`}>
                    <div className="text-xs opacity-70 mb-1">{m.role}</div>
                    <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                  </div>
                ))}
                {(active.messages || []).length === 0 && <div className="text-gray-400 text-sm">Send the first message to start.</div>}
              </div>
              <div className="p-3 border-t flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type your question..." className="flex-1 px-3 py-2 border rounded" />
                <button onClick={send} disabled={busy || !draft.trim()} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 disabled:opacity-50">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">Pick or create a conversation to start.</div>
          )}
        </div>
      </div>
    </div>
  );
}
