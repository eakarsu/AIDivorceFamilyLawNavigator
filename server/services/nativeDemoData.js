import { setImmediate as yieldTurn } from 'node:timers/promises';
import { NATIVE_RECORD_FEATURES, columnFor, demoLabel } from './nativeRecordCatalog.js';

export function assertNotAborted(signal) {
  if (signal?.aborted) throw Object.assign(new Error('Record operation cancelled before commit'), { status: 499 });
}

export async function resolveDemoActor(pool, { userId, email, env = process.env } = {}) {
  const targetEmail = email || (!userId && (env.DEMO_EMAIL || env.SEED_ADMIN_EMAIL || env.ADMIN_EMAIL || env.DEFAULT_EMAIL));
  if (!userId && !targetEmail) throw new Error('Choose an existing account with --user-id or --email. No account is created.');
  if (userId && !/^[1-9]\d*$/.test(String(userId))) throw new Error('user-id must identify an existing positive account ID');
  const { rows } = await pool.query(userId ? 'SELECT id,name,email,role FROM users WHERE id=$1' : 'SELECT id,name,email,role FROM users WHERE email=$1', [userId || targetEmail]);
  if (!rows[0] || (email && rows[0].email !== email)) throw new Error('The selected existing account was not found; no data or account was changed.');
  return rows[0];
}

export async function inspectNativeData(pool, userId, { rowCount = 15 } = {}) {
  const collections = [];
  for (const [feature, config] of Object.entries(NATIVE_RECORD_FEATURES)) {
    const exists = (await pool.query('SELECT to_regclass($1) AS name', [config.table])).rows[0].name;
    if (!exists) { collections.push({ feature, table: config.table, storageReady: false, total: 0, demo: 0, minimum: rowCount }); continue; }
    const metadataReady = (await pool.query("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1 AND column_name='demo_key') AS ready", [config.table])).rows[0].ready;
    const counts = (await pool.query(`SELECT COUNT(*)::int AS total${metadataReady ? ",COUNT(*) FILTER(WHERE is_demo)::int AS demo,COUNT(*) FILTER(WHERE demo_key LIKE 'native-demo-v1/%')::int AS seeded" : ''} FROM ${config.table} WHERE user_id=$1`, [userId])).rows[0];
    collections.push({ feature, table: config.table, storageReady: metadataReady, total: counts.total, demo: counts.demo || 0, minimum: rowCount, pendingDemoExamples: Math.max(0, rowCount - (counts.seeded || 0)) });
  }
  return { userId: String(userId), minimum: rowCount, collections, ready: collections.every(row => row.storageReady), allMinimumsMet: collections.every(row => row.storageReady && row.total >= rowCount) };
}

const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'];
const notes = 'Synthetic practice data only. Confirm actual facts and sources separately; no legal advice, consent, court filing, approval or AI analysis.';

export function nativeDemoValues(feature, ordinal, now = new Date()) {
  const n = String(ordinal).padStart(2, '0'), label = `Demo ${n}`, state = states[(ordinal - 1) % states.length];
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ordinal, 14));
  const day = date.toISOString().slice(0, 10);
  switch (feature) {
    case 'documents': return { title: `${label} — document intake practice`, document_type: 'practice_note', description: notes, content: `GENERATED SYNTHETIC EXAMPLE ${n}\nDocument intake checklist draft. No real case or evidence.`, parties: 'Fictional person A; fictional person B', status: 'draft' };
    case 'assets': return { name: `${label} — fictional household item`, asset_type: 'practice_inventory', estimated_value: ordinal * 125, ownership: 'Unverified example', acquisition_date: null, description: notes, notes: 'Illustrative value only; no appraisal or ownership determination.' };
    case 'custody': return { child_name: `${label} — fictional child`, child_age: 5 + ordinal % 10, current_arrangement: 'Hypothetical draft schedule', desired_arrangement: 'Discussion draft only', special_needs: 'Not supplied', parent_situation: 'Fictional scenario; no factual assessment', notes, status: 'draft' };
    case 'alimony': return { title: `${label} — support discussion draft`, requesting_income: 30000 + ordinal * 1000, paying_income: 50000 + ordinal * 1000, marriage_duration: ordinal, standard_of_living: 'Hypothetical budget scenario', health_conditions: 'Not supplied', employment_status: 'Fictional scenario', state: 'Unverified', notes, status: 'draft' };
    case 'document-gen': return { title: `${label} — unsigned practice document`, document_type: 'unsigned_practice_template', party1_name: 'Fictional person A', party2_name: 'Fictional person B', jurisdiction: 'Not verified', key_terms: 'Discussion placeholders only', special_provisions: 'None asserted', notes, status: 'draft' };
    case 'mediation': return { topic: `${label} — communication practice`, dispute_type: 'hypothetical_discussion', party1_position: 'Fictional discussion point A', party2_position: 'Fictional discussion point B', previous_attempts: 'Not supplied', key_concerns: 'Clarify topics respectfully', desired_outcome: 'Prepare questions for authorized professional', scheduled_date: null, notes, status: 'draft' };
    case 'filing': return { title: `${label} — unsubmitted filing checklist`, filing_type: 'practice_checklist', jurisdiction: 'Not verified', case_type: 'practice_only', description: notes, urgency: 'normal', filing_date: null, notes: 'Not filed, accepted or court-approved.', status: 'draft' };
    case 'financial': return { title: `${label} — fictional budget draft`, disclosure_type: 'practice_budget', annual_income: 40000 + ordinal * 1000, monthly_expenses: 1500 + ordinal * 50, total_assets: ordinal * 5000, total_debts: ordinal * 1000, employment_type: 'Hypothetical', description: notes, notes: 'Fictional amounts; not certified disclosure.', status: 'draft' };
    case 'parenting': return { title: `${label} — discussion schedule`, children_details: 'Fictional child; no identifiable information', schedule_type: 'discussion_draft', holiday_plan: 'Discuss proposed options', communication_method: 'Draft communication preference', special_considerations: 'Not supplied', notes, status: 'draft' };
    case 'property': return { property_name: `${label} — fictional property`, property_type: 'practice_inventory', address: 'Fictional location; no real address', estimated_value: 100000 + ordinal * 5000, mortgage_balance: 50000 + ordinal * 1000, ownership_type: 'Unverified example', acquisition_date: null, description: notes, notes: 'Illustrative amounts only; not a valuation.', status: 'draft' };
    case 'rights': return { title: `${label} — legal research question`, category: 'unverified_research', state, description: 'Draft a question for an authorized professional; no legal conclusion is asserted.', situation: 'Hypothetical planning scenario', notes };
    case 'settlement': return { title: `${label} — unsigned negotiation notes`, agreement_type: 'discussion_draft', party1_name: 'Fictional person A', party2_name: 'Fictional person B', key_terms: 'No agreement reached', asset_division: 'Questions only', support_terms: 'Not agreed', custody_terms: 'Not agreed', notes, status: 'draft' };
    case 'child-support': return { title: `${label} — fictional support inputs`, custodial_income: 30000 + ordinal * 1000, non_custodial_income: 45000 + ordinal * 1000, num_children: 1 + ordinal % 3, children_ages: 'Fictional ages only', custody_arrangement: 'Unverified hypothetical schedule', healthcare_costs: ordinal * 10, childcare_costs: ordinal * 20, state: 'Unverified', special_needs: 'Not supplied', notes, status: 'draft' };
    case 'timeline': return { title: `${label} — planning checklist`, divorce_type: 'practice_planning', state: 'Unverified', filing_date: null, is_contested: false, has_children: false, has_property: false, current_phase: 'Hypothetical planning', notes, status: 'planning' };
    case 'glossary': return { term: `${label} — research term placeholder`, category: 'unverified_study_note', definition: 'Unverified study placeholder. Obtain a definition from a current authoritative source.', context: notes };
    case 'uploads': {
      const text_content = `GENERATED SYNTHETIC EXAMPLE ${n}\nThis text was generated as a sample record, not uploaded as actual evidence.\n${notes}\nPractice task: organize a document checklist.`;
      return { filename: `demo-example-${n}.txt`, document_type: 'generated_example_text', text_content, mime_type: 'text/plain', size_bytes: Buffer.byteLength(text_content, 'utf8') };
    }
    case 'conversations': return { title: `${label} — empty draft conversation`, case_table: null, case_id: null, messages: '[]' };
    case 'court-dates': return { title: `${label} — planning reminder (not a court appointment)`, date: date.toISOString(), native_date_instant: date.toISOString(), case_type: 'demo_planning', case_id: null, description: `${notes} This is a fictional planning reminder, not a court deadline or hearing.`, reminder_sent: false };
    case 'state-law': return { state_code: state, research_question: `${label} — what current official sources should be reviewed in ${state}?`, notes: 'Research template only. No statute, residency period, waiting period, property rule or citation is asserted.' };
    case 'parenting-exchange-incident-log': return { child: `${label} — fictional child`, exchange_date: day, location: 'Fictional meeting place', category: 'communication_practice', severity: 'low', follow_up: `${notes} Practice a neutral follow-up note.` };
    case 'operations': return { task: `${label} — organize a draft planning checklist`, owner: 'Demo planner', priority: ['Low', 'Medium', 'High'][(ordinal - 1) % 3], status: 'Queued' };
    default: throw new Error('Unknown native record collection');
  }
}

export async function seedNativeDemoData(pool, { userId, rowCount = 15, signal, now = new Date(), env = process.env, expectedEmail } = {}) {
  if (env.NODE_ENV === 'production') throw Object.assign(new Error('Synthetic example population is development-only'), { status: 403 });
  if (!Number.isInteger(rowCount) || rowCount < 15 || rowCount > 100) throw new Error('rowCount must be an integer between 15 and 100');
  const client = await pool.connect();
  const inserted = {};
  try {
    await client.query('BEGIN');
    assertNotAborted(signal);
    const actor = (await client.query('SELECT id,email FROM users WHERE id=$1 FOR SHARE', [userId])).rows[0];
    if (!actor || (expectedEmail && actor.email !== expectedEmail)) throw Object.assign(new Error('The selected existing account no longer identifies this session'), { status: 401 });
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`native-record-demo:${userId}`]);
    for (const [feature, config] of Object.entries(NATIVE_RECORD_FEATURES)) {
      inserted[feature] = 0;
      for (let ordinal = 1; ordinal <= rowCount; ordinal += 1) {
        assertNotAborted(signal);
        const values = nativeDemoValues(feature, ordinal, now);
        const fields = Object.keys(values);
        const params = [userId, ...Object.values(values), true, `native-demo-v1/${feature}/${ordinal}`, demoLabel];
        const columns = ['user_id', ...fields.map(field => columnFor(config, field)), 'is_demo', 'demo_key', 'demo_label'];
        const result = await client.query(`INSERT INTO ${config.table} (${columns.join(',')}) VALUES (${columns.map((field, i) => config.calendar && field === 'date' ? `$${i + 1}::timestamptz AT TIME ZONE current_setting('TimeZone')` : '$' + (i + 1)).join(',')}) ON CONFLICT (user_id,demo_key) WHERE demo_key IS NOT NULL DO NOTHING`, params);
        inserted[feature] += result.rowCount;
      }
    }
    await yieldTurn();
    assertNotAborted(signal);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
  return { ...(await inspectNativeData(pool, userId, { rowCount })), inserted, insertedTotal: Object.values(inserted).reduce((a, b) => a + b, 0), preservedExistingRecords: true, accountsCreatedOrChanged: 0, providerCalls: 0 };
}
