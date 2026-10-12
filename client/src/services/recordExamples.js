const examples = [
  { label: 'Demo · early planning', party1: 'Demo Jordan', party2: 'Demo Casey', child: 'Demo Avery', state: 'CA', date: '2026-11-15', amount: 12000, income: 62000, years: 8 },
  { label: 'Demo · financial review', party1: 'Demo Morgan', party2: 'Demo Riley', child: 'Demo Cameron', state: 'NY', date: '2026-12-10', amount: 24000, income: 84000, years: 12 },
  { label: 'Demo · parenting review', party1: 'Demo Alex', party2: 'Demo Taylor', child: 'Demo Quinn', state: 'WA', date: '2027-01-20', amount: 18000, income: 72000, years: 10 },
];

export function recordExamples(config) {
  return examples.map((example, index) => {
    const note = 'Synthetic planning example only. Facts, dates and amounts are invented for this demo; no legal conclusions, approval, filing, consent or source verification is implied.';
    const values = {
      title: `Synthetic demo ${index + 1} · ${config.title}`, name: `Demo asset ${index + 1}`, property_name: `Demo property ${index + 1}`,
      child_name: example.child, child_age: 8 + index, state: example.state, jurisdiction: `Demo ${example.state} jurisdiction; verify locally`,
      document_type: ['planning_note', 'financial_summary', 'parenting_draft'][index], asset_type: ['savings', 'vehicle', 'retirement_account'][index],
      estimated_value: example.amount, ownership: 'Ownership not verified; example joint interest', acquisition_date: example.date,
      description: note, content: `Demo ${config.title} outline. Review missing source documents and ask a licensed attorney to verify the applicable local requirements. ${note}`,
      parties: `${example.party1}; ${example.party2}`, notes: note, status: 'draft',
      current_arrangement: 'Demo weekday schedule; actual arrangement not supplied', desired_arrangement: 'Demo shared calendar with clear pickup reminders',
      special_needs: 'Example placeholder; actual needs and care instructions require verification', parent_situation: 'Demo separate households; actual circumstances not supplied',
      requesting_income: example.income, paying_income: example.income + 18000, marriage_duration: example.years,
      standard_of_living: 'Demo budget includes housing, food and transportation; verify with records', health_conditions: 'Actual health information not supplied; this is a demo placeholder', employment_status: 'Demo employed; not verified',
      party1_name: example.party1, party2_name: example.party2, key_terms: 'Demo discussion topics: separate records, clarify responsibilities and obtain professional review',
      special_provisions: 'No binding provisions; demo draft for review only', topic: `Synthetic demo mediation topic ${index + 1}`,
      dispute_type: ['communication', 'financial disclosure', 'parenting schedule'][index], party1_position: 'Demo request to clarify the available records', party2_position: 'Demo request to review the proposed timeline',
      previous_attempts: 'Demo email discussion; no actual communication asserted', key_concerns: 'Missing documents and unverified local requirements', desired_outcome: 'Prepare a reviewed checklist; do not make a legal decision',
      filing_type: 'planning_checklist', case_type: 'family planning demo', urgency: 'normal', filing_date: example.date,
      disclosure_type: 'demo_budget', annual_income: example.income, monthly_expenses: 3200 + index * 500, total_assets: example.amount * 5, total_debts: example.amount,
      employment_type: 'demo salaried', children_details: `${example.child}, example age ${8 + index}; synthetic household only`, schedule_type: 'demo_shared_calendar',
      holiday_plan: 'Discuss a draft holiday rotation; no agreement has been approved', communication_method: 'Demo shared calendar and written updates', special_considerations: 'Confirm school, travel and actual care needs before using any plan',
      property_type: 'demo residence', address: 'Synthetic demo address; no actual property location supplied', mortgage_balance: example.amount * 2, ownership_type: 'Unverified demo joint interest',
      category: 'demo planning', situation: `Demo planning request for ${example.state}; ask a licensed attorney to verify jurisdiction and source facts. ${note}`,
      agreement_type: 'nonbinding_demo_draft', asset_division: 'List example assets for review; no legal division proposed', support_terms: 'Demo budget discussion only; no support amount is determined', custody_terms: 'Discussion draft only; no custody decision is implied',
      custodial_income: example.income, non_custodial_income: example.income + 18000, num_children: index + 1, children_ages: ['8', '9, 12', '10, 13, 15'][index],
      custody_arrangement: 'Demo discussion draft; actual arrangement must be confirmed', healthcare_costs: 200 + index * 50, childcare_costs: 500 + index * 100,
      divorce_type: 'demo planning', is_contested: false, has_children: true, has_property: true, current_phase: 'demo intake',
      term: `Demo planning term ${index + 1}`, definition: 'Synthetic learning note; verify the meaning and local application with a reliable legal source', context: note,
      scheduled_date: example.date,
      filename: `synthetic-demo-${index + 1}.txt`, text_content: `Generated synthetic text example ${index + 1}. ${note}`,
      state_code: example.state, research_question: `Demo research question: which current local sources should be verified before proceeding in ${example.state}?`,
      child: example.child, exchangeDate: example.date, location: 'Synthetic demo community pickup point', severity: ['low', 'medium', 'high'][index], followUp: 'Demo follow-up: verify the neutral facts with authorized records',
      task: `Synthetic operations follow-up ${index + 1} · check missing documentation`, owner: 'Demo planning team', priority: ['Low', 'Medium', 'High'][index],
      date: `${example.date}T10:30`, case_type: 'synthetic planning reminder',
    };
    if (config.endpoint === 'operations') values.status = 'Queued';
    const references = config.endpoint === 'court-dates' ? ['case_id', 'case_table', 'case_type'] : ['case_id', 'case_table'];
    return { label: example.label, values: Object.fromEntries(config.fields.filter(field => !references.includes(field)).map(field => [field, values[field] ?? note])) };
  });
}
