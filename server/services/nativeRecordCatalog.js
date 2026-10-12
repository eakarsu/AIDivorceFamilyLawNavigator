const feature = (table, fields, required, options = {}) => ({ table, fields, required, ...options });

// These are the application's existing domain records, not legal/provider actions.
export const NATIVE_RECORD_FEATURES = Object.freeze({
  documents: feature('legal_documents', ['title', 'document_type', 'description', 'content', 'parties', 'status'], ['title', 'document_type']),
  assets: feature('marital_assets', ['name', 'asset_type', 'estimated_value', 'ownership', 'acquisition_date', 'description', 'notes'], ['name', 'asset_type']),
  custody: feature('custody_cases', ['child_name', 'child_age', 'current_arrangement', 'desired_arrangement', 'special_needs', 'parent_situation', 'notes', 'status'], ['child_name']),
  alimony: feature('alimony_cases', ['title', 'requesting_income', 'paying_income', 'marriage_duration', 'standard_of_living', 'health_conditions', 'employment_status', 'state', 'notes', 'status'], ['title']),
  'document-gen': feature('generated_documents', ['title', 'document_type', 'party1_name', 'party2_name', 'jurisdiction', 'key_terms', 'special_provisions', 'notes', 'status'], ['title', 'document_type']),
  mediation: feature('mediation_sessions', ['topic', 'dispute_type', 'party1_position', 'party2_position', 'previous_attempts', 'key_concerns', 'desired_outcome', 'scheduled_date', 'notes', 'status'], ['topic']),
  filing: feature('court_filings', ['title', 'filing_type', 'jurisdiction', 'case_type', 'description', 'urgency', 'filing_date', 'notes', 'status'], ['title', 'filing_type']),
  financial: feature('financial_disclosures', ['title', 'disclosure_type', 'annual_income', 'monthly_expenses', 'total_assets', 'total_debts', 'employment_type', 'description', 'notes', 'status'], ['title']),
  parenting: feature('parenting_plans', ['title', 'children_details', 'schedule_type', 'holiday_plan', 'communication_method', 'special_considerations', 'notes', 'status'], ['title']),
  property: feature('property_valuations', ['property_name', 'property_type', 'address', 'estimated_value', 'mortgage_balance', 'ownership_type', 'acquisition_date', 'description', 'notes', 'status'], ['property_name']),
  rights: feature('legal_rights', ['title', 'category', 'state', 'description', 'situation', 'notes'], ['title']),
  settlement: feature('settlement_agreements', ['title', 'agreement_type', 'party1_name', 'party2_name', 'key_terms', 'asset_division', 'support_terms', 'custody_terms', 'notes', 'status'], ['title']),
  'child-support': feature('child_support_cases', ['title', 'custodial_income', 'non_custodial_income', 'num_children', 'children_ages', 'custody_arrangement', 'healthcare_costs', 'childcare_costs', 'state', 'special_needs', 'notes', 'status'], ['title']),
  timeline: feature('divorce_timelines', ['title', 'divorce_type', 'state', 'filing_date', 'is_contested', 'has_children', 'has_property', 'current_phase', 'notes', 'status'], ['title']),
  glossary: feature('legal_glossary', ['term', 'category', 'definition', 'context'], ['term']),
  uploads: feature('uploaded_documents', ['filename', 'document_type', 'text_content'], ['filename'], { upload: true }),
  conversations: feature('case_conversations', ['title', 'case_table', 'case_id'], ['title'], { conversation: true }),
  'court-dates': feature('court_dates', ['title', 'date', 'case_type', 'case_id', 'description'], ['title', 'date'], { calendar: true }),
  'state-law': feature('state_law_research_templates', ['state_code', 'research_question', 'notes'], ['state_code', 'research_question'], { researchTemplate: true }),
  'parenting-exchange-incident-log': feature('parenting_exchange_incidents', ['child', 'exchangeDate', 'location', 'category', 'severity', 'followUp'], ['child', 'exchangeDate', 'category'], { aliases: { exchangeDate: 'exchange_date', followUp: 'follow_up' } }),
  operations: feature('navigation_operations_records', ['task', 'owner', 'priority', 'status'], ['task'], { operations: true }),
});

export const NUMERIC_FIELDS = new Set(['estimated_value', 'child_age', 'requesting_income', 'paying_income', 'marriage_duration', 'annual_income', 'monthly_expenses', 'total_assets', 'total_debts', 'mortgage_balance', 'custodial_income', 'non_custodial_income', 'num_children', 'healthcare_costs', 'childcare_costs']);
export const DATE_FIELDS = new Set(['acquisition_date', 'scheduled_date', 'filing_date', 'exchangeDate']);
export const BOOLEAN_FIELDS = new Set(['is_contested', 'has_children', 'has_property']);
export const columnFor = (config, field) => config.aliases?.[field] || field;
export const demoLabel = 'Synthetic example — not a real family, court event, legal finding, consent, approval or AI response';

export function recordCapabilities(config, row) {
  const providerEvidence = Boolean(row && (row.ai_analysis || row.ai_results != null || (config.conversation && Array.isArray(row.messages) && row.messages.some(message => ['assistant', 'system'].includes(message?.role)))));
  const finalLegalRecord = !config.operations && Boolean(row && ['approved', 'filed', 'executed', 'signed', 'attorney_reviewed', 'verified', 'paid'].includes(String(row.status || '').toLowerCase()));
  const retainedReason = providerEvidence ? 'This record retains provider output and its original context; edit/delete are unavailable in the record-only workspace.' : finalLegalRecord ? 'Final legal/approval records remain retained in their authorized workflow.' : '';
  return { canCreate: true, canEdit: !retainedReason && !(config.upload && row && !row.is_demo), canDelete: !retainedReason, canAnalyze: false, recordOnly: true, retainedReason, providerReason: 'Record drafts do not run AI analysis or establish a legal result. Analysis belongs to the existing authorized AI workflow.' };
}

export function presentNativeRecord(config, row) {
  const aliases = Object.fromEntries(Object.entries(config.aliases || {}).map(([field, column]) => [field, row[column]]));
  return { ...row, ...aliases, capabilities: recordCapabilities(config, row), editableFields: config.fields, ...(config.researchTemplate ? { record_kind: 'research_template', source: null, property_regime: null, mandatory_waiting_period_days: null, residency_requirement_months: null } : {}), ...(config.upload && row.is_demo ? { record_kind: 'generated_example_text', uploadedEvidence: false } : {}) };
}
