import { useEffect, useRef, useState } from 'react';
import FeaturePage from './FeaturePage';
import api from '../services/api';
import { recordFeatures } from '../services/recordFeatures';
import { isCancelled, recordDetail, requestError } from '../services/recordData';

export default function UploadsPage() {
  const [file, setFile] = useState(null), [documentType, setDocumentType] = useState('settlement_agreement');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [revision, setRevision] = useState(0);
  const pending = useRef(null), fileInput = useRef(null);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  const upload = async event => {
    event.preventDefault(); if (!file || pending.current) return;
    const controller = new AbortController(); pending.current = controller; setBusy(true); setError(''); setMessage('');
    try {
      const body = new FormData(); body.append('file', file); body.append('document_type', documentType);
      const response = await api.post('/records/uploads', body, { signal: controller.signal });
      recordDetail(response);
      if (pending.current !== controller || controller.signal.aborted) return;
      setFile(null); if (fileInput.current) fileInput.current.value = ''; setRevision(value => value + 1); setMessage('File saved. This records the supplied source file; no AI review, approval or court filing was performed.');
    } catch (failure) { if (pending.current === controller && !isCancelled(failure, controller.signal)) setError(requestError(failure, 'Could not upload the file')); }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false); } }
  };
  const cancel = () => { pending.current?.abort(); pending.current = null; setBusy(false); setRevision(value => value + 1); setMessage('Upload request cancelled. The list is being refreshed to confirm the server state.'); };
  return <>
    <section className="max-w-6xl mx-auto mb-6 bg-white border rounded-xl p-5"><h2 className="text-lg font-semibold text-gray-800">Upload an actual file</h2><p className="text-sm text-gray-600 mt-1 mb-4">Choose a file you are authorized to store. Demo text examples are created separately through New Item and remain labeled synthetic.</p>
      {error && <p role="alert" className="ai-alert">{error}</p>}{message && <p role="status" className="text-sm text-blue-700 mb-3">{message}</p>}
      <form onSubmit={upload} className="flex gap-4 items-end flex-wrap"><div className="flex-1 min-w-0"><label htmlFor="source-file" className="block text-sm font-medium text-gray-700 mb-1">File</label><input id="source-file" ref={fileInput} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} className="w-full"/></div><div><label htmlFor="source-document-type" className="block text-sm font-medium text-gray-700 mb-1">Document type</label><select id="source-document-type" value={documentType} disabled={busy} onChange={event => setDocumentType(event.target.value)} className="px-3 py-2 border rounded-lg"><option value="settlement_agreement">Settlement Agreement</option><option value="parenting_plan">Parenting Plan</option><option value="prenup">Prenup</option><option value="court_filing">Court Filing</option><option value="financial_disclosure">Financial Disclosure</option><option value="other">Other</option></select></div><button type="submit" className="btn btn-primary" disabled={!file || busy}>{busy ? 'Uploading…' : 'Upload file'}</button>{busy && <button type="button" className="btn btn-secondary" onClick={cancel}>Cancel upload</button>}</form>
    </section>
    <FeaturePage key={revision} config={recordFeatures.uploads}/>
  </>;
}
