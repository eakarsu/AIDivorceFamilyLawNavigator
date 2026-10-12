const field = (key, label, extra = {}) => ({ key, label, ...extra });
export const predictiveTools = [
 { id:'predict-trial-outcome', label:'Trial Outcome Prediction', icon:'Target', fields:[field('case_facts','Case Facts',{multiline:true,required:true}),field('jurisdiction','Jurisdiction'),field('parties','Parties involved'),field('claims','Claims at issue')] },
 { id:'predict-custody-outcome', label:'Custody Outcome Prediction', icon:'Users', fields:[field('case_id','Saved custody case',{reference:'custody'}),field('custody_facts','Custody Facts',{multiline:true,required:true}),field('jurisdiction','Jurisdiction'),field('child_factors','Child Factors',{multiline:true})] },
 { id:'draft-documents', label:'AI Document Drafter', icon:'FileText', fields:[field('document_type','Document Type',{required:true}),field('parties','Parties'),field('jurisdiction','Jurisdiction'),field('facts','Facts / Terms',{multiline:true})] },
 { id:'state-aware-guidance', label:'State-Aware Guidance', icon:'Map', fields:[field('state','U.S. State'),field('topic','Topic',{options:['divorce-process','child-support','alimony','custody','property']}),field('facts','Your Facts',{multiline:true})] },
 { id:'coparenting-message-coach', label:'Co-parenting Message Coach', icon:'MessageSquare', fields:[field('draft','Draft Message',{multiline:true,required:true}),field('audience','Audience'),field('tone','Desired tone')] },
 { id:'legal-research-search', label:'Legal Research', icon:'Search', integration:true, fields:[field('query','Search query',{required:true}),field('jurisdiction','Jurisdiction')] },
 { id:'esign-request', label:'E-signature Request', icon:'PenTool', integration:true, fields:[field('document_id','Saved document',{reference:'documents',required:true}),field('signers','Signer emails',{required:true})] },
 { id:'court-filing-submit', label:'Court Filing', icon:'Gavel', integration:true, fields:[field('document_id','Saved document',{reference:'documents',required:true}),field('jurisdiction','Jurisdiction',{required:true})] },
];
export const predictiveExampleLabels=['Demo AI · planning','Demo AI · detailed','Demo AI · concise'];
const jurisdictions=['California','New York','Texas'];
const facts=[
 'Fictional practice scenario: Alex Morgan and Jordan Morgan are separating after eight years. They want to organize household-property, budget and unsigned-agreement questions. No court findings, verified law or actual case evidence are supplied.',
 'Fictional practice scenario: two parents want to compare school-week schedules, holiday arrangements and communication plans. Work schedules and budget figures are illustrative. Identify missing evidence and questions for licensed counsel; no result is established.',
 'Fictional practice scenario: two spouses want a short planning checklist for an amicable separation. No filing, approval, deadline or legal entitlement has been established. Flag assumptions and information to verify.',
];
export const predictiveRecordLabel = row => row.title || row.child_name || `Record ${row.id}`;
function savedReference(records=[], currentId, variant) {
 const current=records.find(row=>String(row.id)===String(currentId));
 const examples=records.filter(row=>row.is_demo===true);
 // Preserve the real selected source. Otherwise select an actual saved sample,
 // never an invented ID or an unrelated real case.
 return current || examples[variant % Math.max(examples.length,1)] || null;
}
export function predictiveExample(id, variant=0, sources={}, current={}) {
 const n=((variant%3)+3)%3, jurisdiction=jurisdictions[n];
 const custody=savedReference(sources.custody,current.case_id,n), document=savedReference(sources.documents,current.document_id,n);
 const caseFacts=custody ? `Saved account record #${custody.id}: ${custody.child_name||'Name not documented'}. Current arrangement: ${custody.current_arrangement||'Not documented'}. Proposed arrangement: ${custody.desired_arrangement||'Not documented'}. Notes: ${custody.notes||'Not documented'}. ${custody.is_demo?'Synthetic practice record.':'Use only documented source facts; other information requires verification.'}` : facts[n];
 const values={
  'predict-trial-outcome':{case_facts:facts[n],jurisdiction,parties:'Alex Morgan and Jordan Morgan — fictional example parties',claims:['Property discussion and budget questions; no verified legal claim','Proposed parenting schedule and support questions; no finding asserted','Unsigned agreement and process questions for attorney review'][n]},
  'predict-custody-outcome':{case_id:custody?String(custody.id):'',custody_facts:caseFacts,jurisdiction:custody&&!custody.is_demo?current.jurisdiction||'Jurisdiction not documented; verify before use':jurisdiction,child_factors:custody?`Saved age: ${custody.child_age??'Not documented'}. Special needs: ${custody.special_needs||'Not documented'}. School, preferences and professional findings are not documented; verify rather than infer them.`:'Fictional school-age child. No actual age, school records, special needs, preferences or professional findings are supplied. Identify the facts to verify.'},
  'draft-documents':{document_type:['Unsigned property discussion outline','Draft parenting discussion plan','Separation planning checklist'][n],parties:'Alex Morgan and Jordan Morgan — fictional example parties',jurisdiction,facts:`${facts[n]} Prepare an unsigned draft for review. Do not invent agreement, consent, signatures or verified legal terms.`},
  'state-aware-guidance':{state:jurisdiction,topic:['divorce-process','custody','property'][n],facts:`${facts[n]} Identify current authoritative sources to consult; no statute, waiting period or deadline is a verified fact.`},
  'coparenting-message-coach':{draft:['Could we review the proposed school pickup plan together and confirm the times before making changes?','I would like to discuss the holiday schedule. Please suggest a time to compare options and identify unresolved questions.','Can we confirm our next planning conversation and share the topics we each want to discuss?'][n],audience:'Co-parent in a fictional communication exercise',tone:['Neutral, calm and child-focused','Respectful, specific and collaborative','Brief, clear and non-accusatory'][n]},
  'legal-research-search':{query:['Current official sources for family-law process and attorney-reviewed planning questions','Current official sources for parenting-plan review and required source evidence','Current official sources for property discussion and unsigned agreement review'][n],jurisdiction},
  'esign-request':{document_id:document?String(document.id):'',signers:`fictional-signer-${n+1}@example.com`},
  'court-filing-submit':{document_id:document?String(document.id):'',jurisdiction:`${jurisdiction} — verify the actual court and filing requirements`},
 }[id];
 if(!values)throw new Error('Unknown predictive AI tool');
 return values;
}
export const predictiveMissingFields=(tool,values)=>tool.fields.filter(field=>values[field.key]===undefined||values[field.key]===null||String(values[field.key]).trim()==='');
