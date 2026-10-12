import { useCallback, useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import api from '../services/api';
import FormattedAIReport from '../components/FormattedAIReport';
import { recordList, isCancelled, requestError } from '../services/recordData';
import { predictiveTools, predictiveExampleLabels, predictiveExample, predictiveMissingFields, predictiveRecordLabel } from '../services/predictiveExamples';

export default function PredictiveAIPage() {
 const [tab,setTab]=useState(predictiveTools[0].id);
 const [forms,setForms]=useState(()=>Object.fromEntries(predictiveTools.map(tool=>[tool.id,predictiveExample(tool.id)])));
 const [sources,setSources]=useState({custody:[],documents:[]}), [sourceStatus,setSourceStatus]=useState({custody:'loading',documents:'loading'}), [sourceErrors,setSourceErrors]=useState({});
 const [busy,setBusy]=useState(false), [error,setError]=useState(''), [result,setResult]=useState(null);
 const [notice,setNotice]=useState('A complete fictional planning example is loaded. Review every field before generating.');
 const active=useRef(null), sourceRequests=useRef({}), alive=useRef(true), selectedTab=useRef(tab);
 const tool=predictiveTools.find(item=>item.id===tab), values=forms[tab], reference=tool.fields.find(field=>field.reference);
 const requiredMissing=predictiveMissingFields(tool,values).filter(field=>field.required);
 const loadSource=useCallback(async feature=>{
  sourceRequests.current[feature]?.abort();
  const controller=new AbortController();sourceRequests.current[feature]=controller;
  setSourceStatus(current=>({...current,[feature]:'loading'}));setSourceErrors(current=>({...current,[feature]:''}));
  try{
   const response=await api.get(`/records/${feature}`,{params:{page:1,limit:100},signal:controller.signal});
   const records=recordList(response,1,100).items;
   if(controller.signal.aborted||sourceRequests.current[feature]!==controller)return;
   setSources(current=>({...current,[feature]:records}));setSourceStatus(current=>({...current,[feature]:'ready'}));
   setForms(current=>Object.fromEntries(Object.entries(current).map(([id,form])=>{
    const field=predictiveTools.find(item=>item.id===id).fields.find(item=>item.reference===feature);
    if(!field||form[field.key])return[id,form];
    const before=predictiveExample(id), example=predictiveExample(id,0,{[feature]:records},form);
    return[id,Object.fromEntries(Object.entries(form).map(([key,value])=>[key,value===before[key]?example[key]:value]))];
   })));
  }catch(failure){if(sourceRequests.current[feature]===controller&&!isCancelled(failure,controller.signal)){setSourceStatus(current=>({...current,[feature]:'error'}));setSourceErrors(current=>({...current,[feature]:requestError(failure,`Could not load saved ${feature}`)}));}}
  finally{if(sourceRequests.current[feature]===controller)delete sourceRequests.current[feature];}
 },[]);
 useEffect(()=>{
  alive.current=true;
  for(const feature of ['custody','documents'])loadSource(feature);
  return()=>{alive.current=false;for(const controller of Object.values(sourceRequests.current))controller.abort();sourceRequests.current={};active.current?.abort();active.current=null;};
 },[loadSource]);
 const applyExample=(id,variant)=>{
  if(busy)return;
  setForms(current=>({...current,[id]:predictiveExample(id,variant,sources,current[id])}));setResult(null);setError('');
  setNotice('Demo AI filled the complete request, including optional inputs. Saved references use actual account records. Review before generating; no AI request was sent.');
 };
 const selectTool=id=>{if(busy)return;selectedTab.current=id;setTab(id);applyExample(id,0);};
 const update=(key,value)=>setForms(current=>{
  const next={...current[tab],[key]:value};
  if(tab==='predict-custody-outcome'&&key==='case_id'){
   const source=sources.custody.find(row=>String(row.id)===String(value));
   if(!source)return{...current,[tab]:next};
   if(!source.is_demo)next.jurisdiction='Jurisdiction not documented; verify before use';
   return{...current,[tab]:predictiveExample(tab,0,sources,next)};
  }
  return{...current,[tab]:next};
 });
 const cancel=()=>{active.current?.abort();active.current=null;setBusy(false);setNotice('Request cancelled. Any response arriving afterward will be ignored.');};
 const submit=async event=>{
  event.preventDefault();if(active.current||requiredMissing.length)return;
  const controller=new AbortController(), requestTab=tab;active.current=controller;setBusy(true);setError('');setResult(null);
  try{const response=await api.post(`/ai/${requestTab}`,values,{signal:controller.signal});if(alive.current&&active.current===controller&&!controller.signal.aborted&&selectedTab.current===requestTab)setResult(response.data);}
  catch(failure){if(alive.current&&active.current===controller&&!isCancelled(failure,controller.signal))setError(requestError(failure,'Could not complete the request'));}
  finally{if(alive.current&&active.current===controller){active.current=null;setBusy(false);}}
 };
 return <section className="max-w-5xl mx-auto fade-in">
  <header className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-xl"><h1 className="text-xl font-bold">Predictive AI Tools</h1><p className="text-blue-100 text-sm mt-1">Choose a tool to load a complete example, review every input, then run the request.</p></header>
  <nav aria-label="Predictive AI tools" className="flex flex-wrap gap-2 mb-4">{predictiveTools.map(item=>{const Icon=Icons[item.icon];return <button type="button" key={item.id} disabled={busy} aria-pressed={tab===item.id} onClick={()=>selectTool(item.id)} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50 ${tab===item.id?'bg-blue-600 text-white shadow':'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}><Icon size={16}/>{item.label}</button>;})}</nav>
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
   <h2 className="text-lg font-semibold mb-3">{tool.label}</h2>
   <section aria-label="Complete AI examples" className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5"><strong>Fill all AI fields</strong><p className="text-sm text-blue-900 mt-1">Every button fills the whole form, including optional inputs. Examples are for review; saved case and document IDs come from your account.</p><div className="flex flex-wrap gap-2 mt-3">{predictiveExampleLabels.map((label,index)=><button type="button" key={label} disabled={busy||(reference&&sourceStatus[reference.reference]==='loading')} onClick={()=>applyExample(tab,index)} className="btn btn-secondary">{label}</button>)}</div></section>
   <p role="status" className="text-sm text-blue-800 mb-4">{notice}</p>
   {reference&&sourceStatus[reference.reference]==='loading'&&<p role="status" className="text-sm text-gray-600 mb-3">Loading actual saved references…</p>}
   {reference&&sourceErrors[reference.reference]&&<div role="alert" className="bg-red-50 text-red-700 p-3 rounded mb-3"><p>{sourceErrors[reference.reference]}</p><button type="button" className="btn btn-secondary mt-2" disabled={busy} onClick={()=>loadSource(reference.reference)}>Retry saved {reference.reference}</button></div>}
   {reference&&sourceStatus[reference.reference]!=='loading'&&!values[reference.key]&&<p className="bg-amber-50 text-amber-900 p-3 rounded mb-3">The text inputs are filled. Select an actual saved {reference.reference==='custody'?'custody case':'document'} below to fill the reference field; no ID is invented. {reference.required?'This integration requires a saved document.':'The custody reference is optional when using the supplied facts.'}</p>}
   {tool.integration&&<p className="bg-amber-50 text-amber-900 p-3 rounded mb-3">This integration depends on its configured provider. Demo values do not send signatures, file a document, verify law or configure credentials. The current research, signature and filing connectors report their available or stubbed state when explicitly checked.</p>}
   {tab==='esign-request'&&<p className="text-sm text-gray-600 mb-3">Example signer addresses use example.com. Replace them with the intended recipients before a real signature workflow.</p>}
   {error&&<p role="alert" className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</p>}
   <form onSubmit={submit} className="space-y-4">
    {tool.fields.map(field=><div key={field.key} data-ai-field={field.key}><label htmlFor={`predictive-${field.key}`} className="block text-sm font-semibold mb-1">{field.label}{field.required?' *':' (optional)'}</label>{field.reference?<select id={`predictive-${field.key}`} value={values[field.key]} disabled={busy||sourceStatus[field.reference]==='loading'} onChange={event=>update(field.key,event.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="">Select an actual saved {field.reference==='custody'?'case':'document'}</option>{sources[field.reference].map(row=><option key={row.id} value={String(row.id)}>{predictiveRecordLabel(row)} · #{row.id}{row.is_demo?' · sample':''}</option>)}</select>:field.options?<select id={`predictive-${field.key}`} value={values[field.key]} disabled={busy} onChange={event=>update(field.key,event.target.value)} className="w-full px-3 py-2 border rounded-lg">{field.options.map(option=><option key={option} value={option}>{option.replaceAll('-',' ')}</option>)}</select>:field.multiline?<textarea id={`predictive-${field.key}`} rows={4} required={field.required} value={values[field.key]} disabled={busy} onChange={event=>update(field.key,event.target.value)} className="w-full px-3 py-2 border rounded-lg resize-y"/>:<input id={`predictive-${field.key}`} required={field.required} value={values[field.key]} disabled={busy} onChange={event=>update(field.key,event.target.value)} className="w-full px-3 py-2 border rounded-lg"/>}</div>)}
    <div className="flex flex-wrap gap-2 pt-2"><button type="submit" disabled={busy||requiredMissing.length>0} className="btn btn-primary">{busy?'Running…':tool.integration?'Check configured integration':'Generate with OpenRouter'}</button><button type="button" disabled={!busy} onClick={cancel} className="btn btn-secondary">Cancel request</button></div>
   </form>
  </div>
  {result&&<div className="bg-white rounded-xl shadow-sm border p-6"><FormattedAIReport title={tool.integration?'Integration status':tool.label} sourceLabel={tool.integration?'Integration status':'OpenRouter response'} response={result.prediction||result.guidance||result.coaching||result.draft||result}/></div>}
 </section>;
}
