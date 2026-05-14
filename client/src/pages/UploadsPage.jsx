import { useEffect, useState } from 'react';
import api from '../services/api';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { Upload, Sparkles, Loader2, Trash2, FileText } from 'lucide-react';

export default function UploadsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('settlement_agreement');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const load = async (page = 1) => {
    try {
      const r = await api.get('/uploads', { params: { page, limit: 20 } });
      setItems(r.data?.data || []);
      setPagination(r.data?.pagination || { page: 1, totalPages: 1 });
    } catch (_) { setError('Failed to load uploads'); }
  };

  useEffect(() => { load(1); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('document_type', docType);
      await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      load(1);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally { setBusy(false); }
  };

  const view = async (id) => {
    try {
      const r = await api.get(`/uploads/${id}`);
      setSelected(r.data);
    } catch (_) { setError('Failed to load'); }
  };

  const analyze = async () => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const r = await api.post(`/uploads/${selected.id}/analyze`);
      setSelected({ ...selected, ai_analysis: r.data.ai_analysis, ai_results: r.data.ai_results });
      load(pagination.page);
    } catch (e) {
      setError(e.response?.data?.error || 'Analyze failed');
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this upload?')) return;
    try { await api.delete(`/uploads/${id}`); if (selected?.id === id) setSelected(null); load(pagination.page); }
    catch (_) { setError('Delete failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Document Upload &amp; AI Review</h1>
          <p className="text-gray-500 text-sm">Upload PDF/text/markdown — AI extracts terms, risks, deadlines, and recommendations.</p>
        </div>
      </div>

      {error && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>)}

      <form onSubmit={upload} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-6 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
          <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="settlement_agreement">Settlement Agreement</option>
            <option value="parenting_plan">Parenting Plan</option>
            <option value="prenup">Prenup</option>
            <option value="court_filing">Court Filing</option>
            <option value="financial_disclosure">Financial Disclosure</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button disabled={busy || !file} type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b font-semibold">Your Uploads ({pagination.total || items.length})</div>
          <div className="divide-y">
            {items.map((d) => (
              <button key={d.id} onClick={() => view(d.id)} className={`w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50/50 ${selected?.id === d.id ? 'bg-blue-50' : ''}`}>
                <FileText size={16} className="text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{d.filename}</div>
                  <div className="text-xs text-gray-500">{d.document_type || '—'} · {(d.size_bytes / 1024).toFixed(1)} KB · {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                {d.ai_analysis && <Sparkles size={12} className="text-purple-500" />}
                <span onClick={(e) => { e.stopPropagation(); remove(d.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></span>
              </button>
            ))}
            {items.length === 0 && <div className="p-4 text-sm text-gray-400">No uploads yet.</div>}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">{selected.filename}</h2>
                <button onClick={analyze} disabled={busy} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {selected.ai_analysis ? 'Re-Analyze' : 'Analyze with AI'}
                </button>
              </div>
              <div className="text-xs text-gray-500 mb-3">{selected.document_type || '—'} · {(selected.size_bytes / 1024).toFixed(1)} KB · {selected.text_content ? `${selected.text_content.length} chars extracted` : 'no text extracted'}</div>
              {selected.ai_analysis ? (
                <AIResponseDisplay content={selected.ai_analysis} />
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 rounded p-3">
                  <p className="mb-2">No analysis yet. Click "Analyze with AI" above.</p>
                  {selected.text_content && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">Preview extracted text (first 500 chars)</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs">{selected.text_content.substring(0, 500)}{selected.text_content.length > 500 ? '...' : ''}</pre>
                    </details>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400">Select an upload from the list to view details and run AI analysis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
