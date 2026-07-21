import pg from 'pg';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

if (process.env.CONFIRM_DEMO_SEED !== 'yes') {
  throw new Error('Refusing destructive seed without CONFIRM_DEMO_SEED=yes');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema created.');

  const hash = await bcrypt.hash('password123', 10);
  const userResult = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ('John Demo', 'demo@example.com', $1) RETURNING id",
    [hash]
  );
  const userId = userResult.rows[0].id;
  console.log('Demo user created: demo@example.com / password123');

  // Seed Legal Documents
  const documents = [
    ['Petition for Dissolution of Marriage', 'Petition', 'Initial divorce filing petition for Johnson v. Johnson', 'Petitioner seeks dissolution of marriage on grounds of irreconcilable differences', 'John Johnson, Jane Johnson'],
    ['Marital Settlement Agreement Draft', 'Settlement', 'Proposed terms for division of assets and custody', 'Proposed 50/50 split of marital assets with joint custody of minor children', 'John Johnson, Jane Johnson'],
    ['Temporary Restraining Order', 'Court Order', 'Emergency protective order for domestic situation', 'Order preventing disposal of marital assets during proceedings', 'Court of Family Law, John Johnson'],
    ['Child Custody Evaluation Report', 'Evaluation', 'Professional custody evaluation by Dr. Smith', 'Comprehensive evaluation of parenting capabilities and child preferences', 'Dr. Sarah Smith, Child Evaluator'],
    ['Financial Declaration Form', 'Financial', 'Required income and expense declaration', 'Complete financial disclosure as required by the court', 'John Johnson'],
    ['Prenuptial Agreement', 'Agreement', 'Original prenuptial agreement from 2015', 'Terms agreed upon before marriage regarding asset protection', 'John Johnson, Jane Johnson'],
    ['Motion for Temporary Support', 'Motion', 'Request for temporary spousal and child support', 'Motion requesting financial support during divorce proceedings', 'John Johnson (Petitioner)'],
    ['Qualified Domestic Relations Order', 'Court Order', 'QDRO for retirement account division', 'Order dividing 401(k) retirement accounts between parties', 'Plan Administrator, John Johnson, Jane Johnson'],
    ['Parenting Plan Proposal', 'Proposal', 'Proposed parenting schedule and decision-making framework', 'Detailed plan for custody schedule, holidays, and major decisions', 'John Johnson, Jane Johnson'],
    ['Property Appraisal Report', 'Appraisal', 'Professional appraisal of marital residence', 'Appraisal of family home at 123 Oak Street', 'Licensed Appraiser Mike Torres'],
    ['Mediation Agreement', 'Agreement', 'Terms agreed upon during mediation session', 'Partial agreement reached during court-ordered mediation', 'Mediator Susan Clark'],
    ['Discovery Request Documents', 'Discovery', 'Interrogatories and document requests', 'Formal discovery requests for financial records and communications', 'Attorney Records'],
    ['Guardian Ad Litem Report', 'Report', 'GAL recommendations for child custody', 'Independent report on children best interests', 'Guardian Ad Litem Patricia Lee'],
    ['Domestic Violence Protection Order', 'Protection Order', 'Emergency protection order documentation', 'Temporary protective order with conditions', 'Family Court Judge Williams'],
    ['Final Divorce Decree Draft', 'Decree', 'Proposed final judgment of dissolution', 'Draft of final divorce decree incorporating all agreements', 'Court of Family Law'],
  ];
  for (const [title, type, desc, content, parties] of documents) {
    await pool.query(
      'INSERT INTO legal_documents (user_id, title, document_type, description, content, parties) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, title, type, desc, content, parties]
    );
  }
  console.log('Legal documents seeded.');

  // Seed Marital Assets
  const assets = [
    ['Family Home - 123 Oak Street', 'Real Estate', 650000, 'Joint', '2018-03-15', 'Primary family residence, 4BR/3BA'],
    ['Vacation Condo - Lake Tahoe', 'Real Estate', 320000, 'Joint', '2020-07-01', 'Vacation property purchased during marriage'],
    ['2022 Tesla Model Y', 'Vehicle', 45000, 'Husband', '2022-01-15', 'Primary vehicle for husband'],
    ['2021 BMW X5', 'Vehicle', 38000, 'Wife', '2021-06-20', 'Primary vehicle for wife'],
    ['Fidelity 401(k) - Husband', 'Retirement', 285000, 'Husband', '2015-01-01', 'Employer-sponsored retirement account'],
    ['Vanguard IRA - Wife', 'Retirement', 165000, 'Wife', '2016-03-01', 'Individual retirement account'],
    ['Joint Savings Account', 'Bank Account', 95000, 'Joint', '2017-01-01', 'Primary joint savings at Chase Bank'],
    ['Investment Portfolio - Schwab', 'Investment', 175000, 'Joint', '2019-06-01', 'Diversified stock and bond portfolio'],
    ['Husband Business - Tech Consulting LLC', 'Business', 450000, 'Husband', '2019-01-01', 'IT consulting business started during marriage'],
    ['Antique Furniture Collection', 'Personal Property', 28000, 'Joint', '2017-05-01', 'Collection of antique furniture accumulated during marriage'],
    ['Diamond Jewelry Set', 'Personal Property', 15000, 'Wife', '2018-12-25', 'Engagement ring, wedding band, anniversary necklace'],
    ['Cryptocurrency Portfolio', 'Investment', 42000, 'Husband', '2020-03-01', 'Bitcoin and Ethereum holdings'],
    ['Life Insurance Policy', 'Insurance', 500000, 'Joint', '2017-01-01', 'Term life insurance policy with cash value'],
    ['College Savings 529 Plans', 'Education', 85000, 'Joint', '2019-09-01', '529 plans for both children'],
    ['Rental Property - 456 Elm Ave', 'Real Estate', 275000, 'Joint', '2021-02-01', 'Investment rental property generating income'],
  ];
  for (const [name, type, value, ownership, date, desc] of assets) {
    await pool.query(
      'INSERT INTO marital_assets (user_id, name, asset_type, estimated_value, ownership, acquisition_date, description) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, name, type, value, ownership, date, desc]
    );
  }
  console.log('Marital assets seeded.');

  // Seed Custody Cases
  const custodyCases = [
    ['Emma Johnson', 8, 'Primary with mother', 'Joint 50/50', null, 'Both parents are involved and loving. Mother works part-time, father works full-time remotely.'],
    ['Liam Johnson', 5, 'Primary with mother', 'Joint 50/50', null, 'Younger child, attends kindergarten. Both parents active in school activities.'],
    ['Sophia Williams', 12, 'Sole with father', 'Joint custody', 'Mild anxiety requiring therapy', 'Child prefers equal time with both parents. Currently seeing therapist.'],
    ['Noah Davis', 3, 'Primary with mother', 'Primary with father', null, 'Toddler requiring consistent routine. Father recently relocated closer.'],
    ['Olivia Martinez', 15, 'Joint custody', 'Primary with mother', null, 'Teenager with strong preference to live with mother near school and friends.'],
    ['Ethan Brown', 10, 'Primary with father', 'Joint 50/50', 'ADHD - requires medication management', 'Child does well in structured environment. Both parents trained in ADHD management.'],
    ['Ava Wilson', 7, 'Temporary with grandparents', 'Joint custody', null, 'Child placed with grandparents during initial separation. Both parents seeking custody.'],
    ['Mason Taylor', 14, 'Joint custody', 'Primary with father', 'Gifted program student', 'Academically gifted child. School district consideration important.'],
    ['Isabella Anderson', 6, 'Primary with mother', 'Joint 50/50', null, 'First grader adjusting to parents separation. Both parents cooperative.'],
    ['James Thomas', 11, 'Sole with mother', 'Joint custody', 'Asthma requiring regular medical care', 'Father seeking more parenting time after completing parenting classes.'],
    ['Charlotte Jackson', 9, 'Joint custody', 'Modified joint custody', null, 'Parents live 30 miles apart. Transportation logistics need addressing.'],
    ['Benjamin White', 4, 'Primary with mother', 'Joint 50/50', 'Speech therapy needed', 'Child in speech therapy twice weekly. Both parents attend sessions.'],
    ['Mia Harris', 13, 'Primary with father', 'Joint custody', null, 'Teenager involved in competitive sports. Training schedule affects custody.'],
    ['Lucas Martin', 2, 'Primary with mother', 'Supervised visitation for father', null, 'Very young child. Father in anger management program, seeking unsupervised time.'],
    ['Harper Garcia', 16, 'Joint custody', 'Primary with mother', null, 'Close to driving age. Wants stability to finish high school with friends.'],
  ];
  for (const [name, age, current, desired, needs, situation] of custodyCases) {
    await pool.query(
      'INSERT INTO custody_cases (user_id, child_name, child_age, current_arrangement, desired_arrangement, special_needs, parent_situation) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, name, age, current, desired, needs, situation]
    );
  }
  console.log('Custody cases seeded.');

  // Seed Alimony Cases
  const alimonyCases = [
    ['Johnson v. Johnson Alimony', 35000, 150000, 15, 'Upper middle class', null, 'Part-time employed', 'California'],
    ['Smith Spousal Support Case', 0, 120000, 20, 'Upper class', 'Chronic back pain', 'Unemployed - stayed home with children', 'New York'],
    ['Davis Rehabilitative Alimony', 28000, 95000, 8, 'Middle class', null, 'Re-entering workforce after career break', 'Texas'],
    ['Williams Temporary Support', 45000, 200000, 12, 'Upper class', null, 'Full-time employed, lower earner', 'Florida'],
    ['Brown Long-term Marriage Support', 0, 175000, 25, 'Upper middle class', 'Disability', 'Disabled, unable to work', 'Illinois'],
    ['Martinez Short Marriage Case', 55000, 85000, 3, 'Middle class', null, 'Both employed full-time', 'Arizona'],
    ['Taylor Bridge Support Request', 20000, 110000, 10, 'Middle class', null, 'Currently in graduate school', 'Massachusetts'],
    ['Anderson Modification Request', 40000, 130000, 18, 'Upper middle class', 'Depression', 'Employed but income reduced', 'Pennsylvania'],
    ['Thomas High-Asset Case', 75000, 500000, 22, 'Wealthy', null, 'Part-time consultant', 'Connecticut'],
    ['Jackson Standard of Living Case', 30000, 160000, 14, 'Upper middle class', null, 'Seeking to maintain lifestyle', 'New Jersey'],
    ['White Retirement Age Case', 25000, 90000, 30, 'Middle class', 'Heart condition', 'Near retirement age', 'Ohio'],
    ['Harris Career Sacrifice Case', 0, 140000, 16, 'Upper middle class', null, 'Left career to raise children', 'Washington'],
    ['Martin Cohabitation Impact', 38000, 105000, 11, 'Middle class', null, 'Now cohabiting with new partner', 'Georgia'],
    ['Garcia Income Disparity Case', 22000, 250000, 9, 'Upper class', null, 'Significant income gap', 'Colorado'],
    ['Robinson Temporary to Permanent', 15000, 180000, 20, 'Upper middle class', 'Cancer treatment', 'Medical issues preventing employment', 'Virginia'],
  ];
  for (const [title, reqIncome, payIncome, duration, standard, health, employment, state] of alimonyCases) {
    await pool.query(
      'INSERT INTO alimony_cases (user_id, title, requesting_income, paying_income, marriage_duration, standard_of_living, health_conditions, employment_status, state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [userId, title, reqIncome, payIncome, duration, standard, health, employment, state]
    );
  }
  console.log('Alimony cases seeded.');

  // Seed Generated Documents
  const genDocs = [
    ['Separation Agreement', 'Separation Agreement', 'John Johnson', 'Jane Johnson', 'California', 'Asset division 50/50, joint custody, temporary support', null],
    ['Property Settlement Deed', 'Property Settlement', 'John Johnson', 'Jane Johnson', 'California', 'Transfer of family home, vehicle titles, investment accounts', null],
    ['Parenting Time Schedule', 'Parenting Schedule', 'John Johnson', 'Jane Johnson', 'California', 'Alternating weeks, holiday rotation, summer vacation split', null],
    ['Child Support Agreement', 'Support Agreement', 'John Johnson', 'Jane Johnson', 'California', 'Monthly payment of $2,500, healthcare coverage, education expenses', null],
    ['Spousal Support Agreement', 'Alimony Agreement', 'John Johnson', 'Jane Johnson', 'California', 'Rehabilitative alimony for 5 years, decreasing schedule', null],
    ['Marital Settlement Agreement', 'MSA', 'Robert Smith', 'Maria Smith', 'New York', 'Complete settlement including all assets, custody, and support', null],
    ['Quit Claim Deed', 'Property Deed', 'David Williams', 'Sarah Williams', 'Texas', 'Transfer of marital home to wife as part of settlement', null],
    ['Stipulation and Order', 'Court Stipulation', 'Michael Brown', 'Jennifer Brown', 'Florida', 'Agreed-upon terms for temporary orders during proceedings', null],
    ['Divorce Complaint', 'Complaint', 'James Davis', 'Patricia Davis', 'Illinois', 'Formal complaint for divorce citing irreconcilable differences', null],
    ['Motion for Modification', 'Motion', 'John Johnson', 'Jane Johnson', 'California', 'Modification of child support due to income change', 'Job loss resulting in 40% income reduction'],
    ['Temporary Orders Request', 'Motion', 'Thomas Anderson', 'Linda Anderson', 'Massachusetts', 'Emergency temporary orders for custody and support', 'Urgent: spouse relocating with children'],
    ['Discovery Requests', 'Discovery', 'John Johnson', 'Jane Johnson', 'California', 'Interrogatories and document production requests', null],
    ['Mediation Brief', 'Brief', 'John Johnson', 'Jane Johnson', 'California', 'Summary of positions and proposed terms for mediation', null],
    ['Post-Judgment Motion', 'Motion', 'Richard Wilson', 'Karen Wilson', 'Pennsylvania', 'Motion to enforce visitation schedule compliance', 'Repeated denial of court-ordered visitation'],
    ['Collaborative Law Agreement', 'Agreement', 'Steven Taylor', 'Nancy Taylor', 'Connecticut', 'Agreement to resolve divorce through collaborative process', null],
  ];
  for (const [title, type, p1, p2, juris, terms, provisions] of genDocs) {
    await pool.query(
      'INSERT INTO generated_documents (user_id, title, document_type, party1_name, party2_name, jurisdiction, key_terms, special_provisions) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [userId, title, type, p1, p2, juris, terms, provisions]
    );
  }
  console.log('Generated documents seeded.');

  // Seed Mediation Sessions
  const mediations = [
    ['Division of Family Home', 'Property', 'Wants to sell home and split proceeds', 'Wants to keep home and buy out spouse share', null, 'Mortgage still active, children in local school', 'Fair resolution without court intervention'],
    ['Holiday Custody Schedule', 'Custody', 'Alternating holidays yearly', 'Split each holiday in half', 'Informal discussion failed', 'Children have expressed preferences', 'Structured holiday schedule both parents agree on'],
    ['Vehicle Distribution', 'Property', 'Each keeps their primary vehicle', 'Wants compensation for value difference', null, 'One vehicle worth significantly more', 'Equitable vehicle distribution'],
    ['Child Education Decisions', 'Custody', 'Public school near mothers home', 'Private school near fathers workplace', 'Two discussions without resolution', 'Child currently in private school', 'Agreement on schooling that serves child best'],
    ['Retirement Account Division', 'Financial', '60/40 split favoring longer-married spouse', 'Equal 50/50 split', null, 'Significant pre-marital contributions exist', 'Fair division accounting for pre-marital assets'],
    ['Pet Custody Arrangement', 'Property', 'Full custody of family dog', 'Shared custody with alternating weeks', null, 'Dog has been with children primarily', 'Arrangement that keeps pet with children'],
    ['Business Valuation Dispute', 'Financial', 'Values business at $300K', 'Values business at $600K', 'Independent appraisals differ', 'Business started during marriage', 'Agreed-upon business value for settlement'],
    ['Temporary Living Arrangements', 'Living', 'Spouse should move out immediately', 'Need 3 months to find housing', null, 'Tension in household affecting children', 'Peaceful transition timeline'],
    ['College Fund Contributions', 'Financial', 'Equal contributions to 529 plans', 'Contributions proportional to income', null, 'Existing 529 plans with $85K balance', 'Sustainable college funding plan'],
    ['Communication Protocol', 'Co-parenting', 'Email only for non-emergencies', 'Text and phone for flexibility', 'Frequent arguments during exchanges', 'Need structured communication', 'Clear communication boundaries'],
    ['Summer Vacation Schedule', 'Custody', '4 weeks with each parent', '2 weeks with each, rest at camp', null, 'Children enjoy summer camp programs', 'Summer plan balancing fun and parenting time'],
    ['Medical Decision Making', 'Custody', 'Joint medical decisions required', 'Primary decision maker with notification', null, 'Child has ongoing medical needs', 'Medical decision framework that protects child'],
    ['Debt Responsibility Division', 'Financial', 'Split all debt equally', 'Each responsible for own credit cards', null, 'Mix of joint and individual debts totaling $45K', 'Fair debt allocation plan'],
    ['Social Media and Children', 'Co-parenting', 'No posting children photos online', 'Allow with both parents approval', null, 'Privacy concerns for children', 'Social media policy for children'],
    ['Extended Family Visitation', 'Custody', 'Grandparents visit during parent time', 'Dedicated grandparent weekends', null, 'Close relationship with grandparents', 'Grandparent access that respects custody schedule'],
  ];
  for (const [topic, type, p1, p2, prev, concerns, outcome] of mediations) {
    await pool.query(
      'INSERT INTO mediation_sessions (user_id, topic, dispute_type, party1_position, party2_position, previous_attempts, key_concerns, desired_outcome) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [userId, topic, type, p1, p2, prev, concerns, outcome]
    );
  }
  console.log('Mediation sessions seeded.');

  // Seed Court Filings
  const filings = [
    ['Petition for Dissolution', 'Petition', 'Superior Court of California', 'Dissolution', 'Initial filing to begin divorce proceedings', 'high'],
    ['Response to Petition', 'Response', 'Superior Court of California', 'Dissolution', 'Response to divorce petition with counter-claims', 'high'],
    ['Request for Temporary Orders', 'Motion', 'Superior Court of California', 'Support', 'Request for temporary custody and support orders', 'urgent'],
    ['Financial Declaration FL-150', 'Declaration', 'Superior Court of California', 'Financial', 'Required income and expense declaration', 'normal'],
    ['Property Declaration FL-160', 'Declaration', 'Superior Court of California', 'Property', 'Community and separate property declaration', 'normal'],
    ['Request for Order - Custody', 'Motion', 'Superior Court of California', 'Custody', 'Motion for custody modification', 'high'],
    ['Subpoena for Financial Records', 'Subpoena', 'Superior Court of California', 'Discovery', 'Bank and investment account records request', 'normal'],
    ['Motion to Compel Discovery', 'Motion', 'Superior Court of California', 'Discovery', 'Compelling spouse to respond to discovery requests', 'normal'],
    ['Ex Parte Application', 'Emergency Motion', 'Superior Court of California', 'Emergency', 'Emergency request for protective orders', 'urgent'],
    ['Stipulation and Order', 'Stipulation', 'Superior Court of California', 'Agreement', 'Agreed terms submitted to court for approval', 'normal'],
    ['Notice of Motion - Support Modification', 'Motion', 'Superior Court of California', 'Support', 'Motion to modify child support based on changed circumstances', 'high'],
    ['Declaration of Disclosure', 'Declaration', 'Superior Court of California', 'Financial', 'Preliminary declaration of disclosure', 'high'],
    ['Request for Default Judgment', 'Motion', 'Superior Court of California', 'Default', 'Request when spouse fails to respond within 30 days', 'normal'],
    ['Motion for Attorney Fees', 'Motion', 'Superior Court of California', 'Fees', 'Request for spouse to pay attorney fees', 'normal'],
    ['Judgment of Dissolution', 'Judgment', 'Superior Court of California', 'Final', 'Final divorce judgment incorporating all orders', 'high'],
  ];
  for (const [title, type, juris, caseType, desc, urgency] of filings) {
    await pool.query(
      'INSERT INTO court_filings (user_id, title, filing_type, jurisdiction, case_type, description, urgency) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, title, type, juris, caseType, desc, urgency]
    );
  }
  console.log('Court filings seeded.');

  // Seed Financial Disclosures
  const financials = [
    ['Primary Income Declaration', 'Income', 150000, 8500, 1200000, 425000, 'Full-time salaried'],
    ['Secondary Income Sources', 'Income', 25000, 0, 0, 0, 'Freelance consulting'],
    ['Spouse Income Declaration', 'Income', 35000, 4200, 165000, 15000, 'Part-time employed'],
    ['Joint Expense Report', 'Expenses', 0, 12500, 0, 0, 'Joint household expenses'],
    ['Real Estate Holdings', 'Assets', 0, 0, 1245000, 450000, 'Property owner'],
    ['Retirement Account Summary', 'Assets', 0, 0, 450000, 0, 'Multiple retirement accounts'],
    ['Investment Portfolio Declaration', 'Assets', 0, 0, 217000, 0, 'Stock and bond holdings'],
    ['Outstanding Debts Itemization', 'Debts', 0, 2800, 0, 78000, 'Multiple debt obligations'],
    ['Monthly Budget Analysis', 'Expenses', 150000, 9800, 0, 0, 'Post-separation budget needs'],
    ['Business Income Statement', 'Income', 180000, 6000, 450000, 95000, 'Business owner'],
    ['Child-Related Expenses', 'Expenses', 0, 3200, 0, 0, 'Education, activities, healthcare'],
    ['Insurance Policies Summary', 'Assets', 0, 850, 525000, 0, 'Life, health, auto policies'],
    ['Tax Return Summary 2024', 'Tax', 175000, 0, 0, 12000, 'Joint tax filing'],
    ['Hidden Asset Investigation', 'Investigation', 0, 0, 85000, 0, 'Suspected undisclosed accounts'],
    ['Post-Divorce Budget Projection', 'Planning', 75000, 5500, 600000, 200000, 'Projected single household'],
  ];
  for (const [title, type, income, expenses, assets, debts, employment] of financials) {
    await pool.query(
      'INSERT INTO financial_disclosures (user_id, title, disclosure_type, annual_income, monthly_expenses, total_assets, total_debts, employment_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [userId, title, type, income, expenses, assets, debts, employment]
    );
  }
  console.log('Financial disclosures seeded.');

  // Seed Parenting Plans
  const parentingPlans = [
    ['Standard Week-On/Week-Off Plan', 'Ages 8 and 5, both in school', 'Alternating weeks', 'Alternate Thanksgiving and Christmas yearly', 'Email and co-parenting app', null],
    ['2-2-3 Rotation Schedule', 'Age 3, in daycare', '2-2-3 rotation', 'Split holidays equally', 'Co-parenting app only', 'Young child needs consistency'],
    ['School Year Primary Plan', 'Ages 12 and 10, active in sports', 'Primary during school, split summers', 'School holidays split, summer alternating', 'Text for daily, email for decisions', 'Sports schedule coordination needed'],
    ['Long Distance Parenting Plan', 'Age 14, in high school', 'School year with mother, summers with father', 'Major holidays alternating', 'Video calls 3x/week', 'Parents live 500 miles apart'],
    ['Infant Care Schedule', 'Age 1, breastfeeding', 'Primary with mother, increasing father time', 'All holidays with mother until age 2', 'Text and phone', 'Gradual transition as child grows'],
    ['Teenage Flexibility Plan', 'Ages 16 and 15', 'Flexible based on teen preferences', 'Teen chooses with minimum requirements', 'Direct communication', 'Respect teen autonomy while ensuring access'],
    ['Special Needs Accommodation Plan', 'Age 9, autism spectrum', 'Primary with trained parent, regular visits', 'Modified holidays, routine-focused', 'Daily communication required', 'Consistent routine essential for child'],
    ['Multiple Children Split Plan', 'Ages 11, 8, and 4', 'All children together, alternating weeks', 'Rotate holidays, keep siblings together', 'Co-parenting app', 'Keep siblings together always'],
    ['Military Deployment Plan', 'Ages 7 and 5', 'Standard joint when home, full with spouse during deployment', 'Modified during deployment', 'Video calls during deployment', 'Deployment contingency planning'],
    ['Relocation Transition Plan', 'Age 10', 'Transition from 50/50 to long distance', 'Extended time during breaks', 'Daily video calls', 'Gradual adjustment period needed'],
    ['Supervised Visitation Graduation Plan', 'Age 6', 'Supervised to unsupervised transition', 'Supervised visits for holidays initially', 'Through supervisor initially', 'Step-down supervision plan'],
    ['Blended Family Integration Plan', 'Ages 9 and 7, step-siblings ages 8 and 6', 'Standard alternating weeks', 'Coordinate with step-parent schedules', 'Family calendar app', 'Integration with blended family dynamics'],
    ['Summer-Focused Access Plan', 'Age 13, boarding school', 'Boarding school, breaks split equally', 'All school breaks divided equally', 'Weekly calls during school', 'Boarding school schedule drives plan'],
    ['Parallel Parenting Plan', 'Ages 10 and 7', 'Strict alternating weeks, minimal contact between parents', 'Detailed holiday schedule, no flexibility', 'Written communication only', 'High-conflict situation requires structure'],
    ['Bird Nesting Arrangement', 'Ages 8 and 5', 'Children stay in family home, parents rotate', 'Parents rotate for holidays', 'House communication notebook', 'Children stability prioritized'],
  ];
  for (const [title, children, schedule, holiday, comm, special] of parentingPlans) {
    await pool.query(
      'INSERT INTO parenting_plans (user_id, title, children_details, schedule_type, holiday_plan, communication_method, special_considerations) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [userId, title, children, schedule, holiday, comm, special]
    );
  }
  console.log('Parenting plans seeded.');

  // Seed Property Valuations
  const properties = [
    ['Family Home - 123 Oak Street', 'Single Family Home', '123 Oak Street, San Jose, CA 95123', 650000, 380000, 'Joint Tenancy', '2018-03-15'],
    ['Lake Tahoe Vacation Condo', 'Condominium', '456 Lakeview Dr, Tahoe City, CA 96145', 320000, 200000, 'Joint Tenancy', '2020-07-01'],
    ['Rental Property - 456 Elm Ave', 'Rental Property', '456 Elm Avenue, San Jose, CA 95124', 275000, 180000, 'Joint Tenancy', '2021-02-01'],
    ['Downtown Office Space', 'Commercial', '789 Market St, Suite 200, San Francisco, CA', 450000, 280000, 'Husband Sole', '2019-06-01'],
    ['Mountain Cabin Retreat', 'Vacation Home', '100 Pine Ridge Rd, Big Bear Lake, CA', 195000, 120000, 'Joint Tenancy', '2022-01-15'],
    ['Vacant Land - Riverside', 'Land', 'Lot 45, Riverside County, CA', 85000, 0, 'Joint Tenancy', '2020-11-01'],
    ['Beach House - Santa Cruz', 'Vacation Home', '222 Ocean Blvd, Santa Cruz, CA 95060', 520000, 350000, 'Joint Tenancy', '2019-09-01'],
    ['Mobile Home - Sunnyvale', 'Mobile Home', 'Space 33, Sunny Acres Park, Sunnyvale CA', 95000, 0, 'Wife Sole', '2017-04-01'],
    ['Storage Unit Building', 'Commercial', '888 Industrial Way, San Jose, CA', 180000, 100000, 'Husband Sole', '2021-08-01'],
    ['Inherited Farm Property', 'Agricultural', '1200 County Rd, Gilroy, CA', 400000, 0, 'Wife Sole (Inherited)', '2015-01-01'],
    ['Timeshare - Maui Resort', 'Timeshare', 'Grand Wailea Resort, Maui, HI', 35000, 0, 'Joint', '2019-12-01'],
    ['Parking Garage Spaces', 'Commercial', '500 S 1st St Garage, San Jose, CA', 60000, 0, 'Husband Sole', '2020-05-01'],
    ['Townhouse - Investment', 'Townhouse', '345 Vine St, Campbell, CA 95008', 380000, 250000, 'Joint Tenancy', '2022-03-01'],
    ['Workshop/Studio Space', 'Commercial', '77 Artisan Way, Los Gatos, CA', 150000, 80000, 'Wife Sole', '2021-01-01'],
    ['Undeveloped Lot - Monterey', 'Land', 'Parcel 789, Monterey County, CA', 120000, 0, 'Joint Tenancy', '2023-01-01'],
  ];
  for (const [name, type, addr, value, mortgage, ownership, date] of properties) {
    await pool.query(
      'INSERT INTO property_valuations (user_id, property_name, property_type, address, estimated_value, mortgage_balance, ownership_type, acquisition_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [userId, name, type, addr, value, mortgage, ownership, date]
    );
  }
  console.log('Property valuations seeded.');

  // Seed Legal Rights
  const rights = [
    ['Right to Equitable Distribution', 'Property', 'California', 'Right to fair division of marital property under community property laws', 'Going through divorce with significant assets'],
    ['Right to Child Custody', 'Custody', 'California', 'Both parents have equal right to seek custody of their children', 'Seeking primary custody of children'],
    ['Right to Spousal Support', 'Support', 'California', 'Right to request financial support from higher-earning spouse', 'Was stay-at-home parent during marriage'],
    ['Right to Legal Representation', 'Legal', 'California', 'Right to have an attorney represent you in family court', 'Cannot afford an attorney'],
    ['Right to Discovery', 'Legal', 'California', 'Right to request financial and other relevant information from spouse', 'Spouse is hiding assets'],
    ['Right to Modification', 'Support', 'California', 'Right to request changes to support or custody orders when circumstances change', 'Lost job, cannot maintain current payments'],
    ['Right to Due Process', 'Legal', 'California', 'Right to proper notice and opportunity to be heard in court', 'Was served with papers unexpectedly'],
    ['Right to Mediation', 'Dispute Resolution', 'California', 'Right to attempt mediation before trial in custody disputes', 'Want to avoid contentious court battle'],
    ['Right to Privacy', 'Personal', 'California', 'Right to privacy in personal matters during divorce proceedings', 'Spouse sharing private information'],
    ['Right to Protection from Domestic Violence', 'Safety', 'California', 'Right to obtain restraining orders for protection', 'Experiencing threats from spouse'],
    ['Right to Parenting Time', 'Custody', 'California', 'Non-custodial parent right to reasonable visitation', 'Being denied access to children'],
    ['Right to Financial Disclosure', 'Financial', 'California', 'Right to full financial transparency from both parties', 'Suspect spouse has undisclosed income'],
    ['Right to Appeal', 'Legal', 'California', 'Right to appeal court decisions to higher court', 'Disagree with judge custody ruling'],
    ['Right to Name Change', 'Personal', 'California', 'Right to restore maiden name during divorce', 'Want to change back to maiden name'],
    ['Right to Retirement Benefits', 'Financial', 'California', 'Right to share in spouses retirement benefits earned during marriage', 'Spouse has substantial pension'],
  ];
  for (const [title, cat, state, desc, situation] of rights) {
    await pool.query(
      'INSERT INTO legal_rights (user_id, title, category, state, description, situation) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, title, cat, state, desc, situation]
    );
  }
  console.log('Legal rights seeded.');

  // Seed Settlement Agreements
  const settlements = [
    ['Johnson Comprehensive Settlement', 'Comprehensive', 'John Johnson', 'Jane Johnson', 'Equal division of assets, joint custody, rehabilitative alimony', 'All real estate sold, proceeds split 50/50', '$3,000/month for 5 years', 'Joint legal and physical custody'],
    ['Quick Uncontested Settlement', 'Uncontested', 'Mark Stevens', 'Lisa Stevens', 'Simple asset division, no children', 'Each keeps own retirement, split savings', 'No alimony - both employed', null],
    ['High-Asset Settlement Draft', 'Complex', 'Robert Chen', 'Melissa Chen', 'Multiple properties, business interests, trusts', 'Properties appraised and divided by value', '$5,000/month permanent alimony', 'Primary custody to mother'],
    ['Mediated Settlement Terms', 'Mediated', 'David Park', 'Susan Park', 'Terms reached through professional mediation', 'Family home to wife, cabin to husband', '$2,500/month for 3 years', '50/50 custody with detailed schedule'],
    ['Collaborative Divorce Agreement', 'Collaborative', 'James Wilson', 'Karen Wilson', 'Reached through collaborative process', 'All assets valued and split equitably', 'Lump sum payment in lieu of alimony', 'Joint custody, primary with mother'],
    ['Military Divorce Settlement', 'Military', 'Sgt. Tom Harris', 'Amy Harris', 'USFSPA compliant division of military benefits', 'Military pension divided per formula', 'Transitional support for 2 years', 'Custody considering deployment'],
    ['Business Owner Settlement', 'Business', 'Michael Lee', 'Jennifer Lee', 'Business retained by owner, offset with other assets', 'Business to husband, home to wife', '$4,000/month for 7 years', 'Joint custody'],
    ['Gray Divorce Settlement', 'Senior', 'Richard Moore', 'Barbara Moore', 'Late-life divorce with retirement focus', 'Retirement accounts split via QDRO', '$3,500/month lifetime alimony', 'No minor children'],
    ['Interstate Divorce Agreement', 'Interstate', 'Paul Taylor', 'Nicole Taylor', 'Multi-state property and jurisdiction issues', 'CA and NY properties divided', '$2,000/month modifiable', 'Custody per CA guidelines'],
    ['Domestic Violence Settlement', 'Protective', 'Confidential', 'Confidential', 'Settlement with protective provisions', 'Quick liquidation of joint assets', 'Limited duration support', 'Supervised visitation only'],
    ['Same-Sex Divorce Settlement', 'Standard', 'Alex Rivera', 'Jordan Rivera', 'Equal rights settlement with adopted children', 'Community property split equally', 'No alimony, both high earners', 'Joint custody of adopted children'],
    ['Modification Settlement', 'Modification', 'John Johnson', 'Jane Johnson', 'Modified original terms due to job change', 'No property changes', 'Reduced from $3,000 to $2,000/month', 'Custody schedule adjusted'],
    ['Prenup Enforcement Settlement', 'Prenuptial', 'William Grant', 'Elizabeth Grant', 'Settlement guided by prenuptial terms', 'Per prenup: separate property remains separate', 'Prenup waived alimony', 'Custody negotiated separately'],
    ['International Divorce Settlement', 'International', 'Ahmed Hassan', 'Sarah Hassan', 'Cross-border assets and dual citizenship', 'US and overseas properties divided', '$2,500/month US-based support', 'Custody with international travel provisions'],
    ['Post-Judgment Settlement', 'Post-Judgment', 'Chris Martinez', 'Diana Martinez', 'Resolving post-judgment disputes', 'Corrected property division errors', 'Support arrears payment plan', 'Visitation enforcement terms'],
  ];
  for (const [title, type, p1, p2, terms, assets, support, custody] of settlements) {
    await pool.query(
      'INSERT INTO settlement_agreements (user_id, title, agreement_type, party1_name, party2_name, key_terms, asset_division, support_terms, custody_terms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [userId, title, type, p1, p2, terms, assets, support, custody]
    );
  }
  console.log('Settlement agreements seeded.');

  // Seed Child Support Cases
  const childSupport = [
    ['Johnson Family Support Case', 35000, 150000, 2, '8, 5', 'Joint 50/50', 500, 1200, 'California', null],
    ['Smith Single Parent Support', 0, 95000, 3, '12, 9, 6', 'Primary with mother', 800, 2400, 'New York', null],
    ['Davis Modification Request', 42000, 120000, 1, '4', 'Primary with mother', 300, 900, 'Texas', null],
    ['Williams High-Income Case', 65000, 350000, 2, '10, 7', 'Joint custody', 1200, 0, 'Florida', 'Gifted program expenses'],
    ['Brown Special Needs Support', 0, 110000, 1, '8', 'Primary with mother', 2500, 600, 'Illinois', 'Autism therapy and special education'],
    ['Martinez Shared Custody', 55000, 85000, 2, '11, 9', '60/40 split', 400, 800, 'Arizona', null],
    ['Taylor College-Age Support', 30000, 140000, 1, '17', 'Primary with mother', 200, 0, 'Massachusetts', 'College preparation expenses'],
    ['Anderson Multiple Family', 28000, 95000, 4, '14, 12, 8, 5', 'Primary with father', 1500, 3200, 'Pennsylvania', null],
    ['Thomas Interstate Support', 40000, 130000, 2, '9, 6', 'Split between states', 600, 1100, 'Connecticut', 'UIFSA interstate case'],
    ['Jackson Imputed Income', 0, 100000, 1, '5', 'Primary with mother', 400, 800, 'New Jersey', 'Voluntarily unemployed spouse'],
    ['White Arrears Case', 25000, 80000, 2, '13, 10', 'Primary with mother', 500, 0, 'Ohio', '$15,000 in arrears'],
    ['Harris Military Support', 30000, 75000, 3, '11, 8, 4', 'Primary with mother', 600, 1800, 'Virginia', 'BAH included in calculation'],
    ['Martin Self-Employed Case', 45000, 200000, 1, '7', 'Primary with father', 350, 700, 'Georgia', 'Spouse income varies significantly'],
    ['Garcia Teenage Children', 38000, 115000, 2, '16, 15', 'Joint custody', 300, 0, 'Colorado', 'Teens have part-time jobs'],
    ['Robinson Disabled Child', 20000, 90000, 1, '12', 'Primary with mother', 3000, 0, 'Washington', 'Child has cerebral palsy, lifetime support needed'],
  ];
  for (const [title, ci, nci, num, ages, arr, health, childcare, state, needs] of childSupport) {
    await pool.query(
      'INSERT INTO child_support_cases (user_id, title, custodial_income, non_custodial_income, num_children, children_ages, custody_arrangement, healthcare_costs, childcare_costs, state, special_needs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [userId, title, ci, nci, num, ages, arr, health, childcare, state, needs]
    );
  }
  console.log('Child support cases seeded.');

  // Seed Divorce Timelines
  const timelines = [
    ['Johnson Uncontested Divorce', 'Uncontested', 'California', '2024-06-15', false, true, true, 'Filing'],
    ['Smith Contested Custody', 'Contested', 'New York', '2024-03-01', true, true, true, 'Discovery'],
    ['Davis Quick Dissolution', 'Summary Dissolution', 'California', '2024-08-01', false, false, false, 'Waiting Period'],
    ['Williams Complex Assets', 'Contested', 'Florida', '2024-01-15', true, true, true, 'Valuation'],
    ['Brown Mediated Divorce', 'Mediated', 'Illinois', '2024-05-01', false, true, true, 'Mediation'],
    ['Martinez Default Divorce', 'Default', 'Arizona', '2024-07-01', false, false, true, 'Waiting for Response'],
    ['Taylor Collaborative Divorce', 'Collaborative', 'Massachusetts', '2024-04-15', false, true, false, 'Negotiation'],
    ['Anderson Military Divorce', 'Military', 'Virginia', '2024-02-01', true, true, true, 'Service of Process'],
    ['Thomas Interstate Case', 'Interstate', 'Connecticut', '2024-06-01', true, true, true, 'Jurisdiction'],
    ['Jackson Annulment', 'Annulment', 'New Jersey', '2024-09-01', false, false, false, 'Filing'],
    ['White Legal Separation', 'Legal Separation', 'Ohio', '2024-03-15', false, true, true, 'Negotiation'],
    ['Harris High Conflict', 'Contested', 'California', '2024-01-01', true, true, true, 'Trial Preparation'],
    ['Martin Pro Se Divorce', 'Pro Se', 'Georgia', '2024-08-15', false, false, true, 'Document Preparation'],
    ['Garcia Covenant Divorce', 'Covenant', 'Louisiana', '2024-05-15', true, true, false, 'Counseling Required'],
    ['Robinson Emergency Filing', 'Emergency', 'Washington', '2024-09-15', true, true, true, 'Emergency Hearing'],
  ];
  for (const [title, type, state, date, contested, children, property, phase] of timelines) {
    await pool.query(
      'INSERT INTO divorce_timelines (user_id, title, divorce_type, state, filing_date, is_contested, has_children, has_property, current_phase) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [userId, title, type, state, date, contested, children, property, phase]
    );
  }
  console.log('Divorce timelines seeded.');

  // Seed Legal Glossary
  const glossary = [
    ['Alimony', 'Support', 'Court-ordered financial support paid by one spouse to the other after divorce'],
    ['Community Property', 'Property', 'Assets and debts acquired during marriage, owned equally by both spouses'],
    ['Custodial Parent', 'Custody', 'The parent with whom the child primarily lives'],
    ['Discovery', 'Legal Process', 'The legal process of obtaining information and documents from the other party'],
    ['Equitable Distribution', 'Property', 'Fair (not necessarily equal) division of marital property by the court'],
    ['Guardian Ad Litem', 'Custody', 'A court-appointed advocate who represents the best interests of the child'],
    ['Interrogatories', 'Legal Process', 'Written questions one party sends to the other that must be answered under oath'],
    ['Jurisdiction', 'Legal', 'The authority of a court to hear and decide a case'],
    ['Marital Property', 'Property', 'Property acquired during the marriage, subject to division in divorce'],
    ['No-Fault Divorce', 'Divorce Type', 'A divorce where neither party needs to prove wrongdoing by the other'],
    ['Pendente Lite', 'Legal Term', 'Latin for "during litigation" - refers to temporary orders during divorce proceedings'],
    ['QDRO', 'Financial', 'Qualified Domestic Relations Order - used to divide retirement accounts in divorce'],
    ['Separate Property', 'Property', 'Property owned before marriage or received as gift/inheritance during marriage'],
    ['Temporary Orders', 'Legal Process', 'Court orders that remain in effect during divorce proceedings until final judgment'],
    ['Venue', 'Legal', 'The specific court location where a divorce case is filed and heard'],
    ['Bifurcation', 'Legal Process', 'Splitting the divorce into two parts - dissolving the marriage first, resolving other issues later'],
    ['Contempt of Court', 'Legal', 'Willful disobedience of a court order, which can result in fines or jail'],
    ['Deposition', 'Legal Process', 'Out-of-court sworn testimony used to gather information before trial'],
    ['Emancipation', 'Custody', 'Legal process by which a minor becomes self-supporting and independent'],
    ['Forensic Accountant', 'Financial', 'An accountant who investigates financial records to uncover hidden assets or income'],
  ];
  for (const [term, cat, def] of glossary) {
    await pool.query(
      'INSERT INTO legal_glossary (user_id, term, category, definition) VALUES ($1,$2,$3,$4)',
      [userId, term, cat, def]
    );
  }
  console.log('Legal glossary seeded.');

  console.log('\\nAll seed data inserted successfully!');
  console.log('Login: demo@example.com / password123');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
