# Operations, privacy, and legal boundary

Run `scripts/bootstrap.sh`, configure the intended development database, and apply `scripts/migrate.sh`. Native record preparation uses additive migrations; it never runs the historical destructive `server/schema.sql` or creates, resets or promotes accounts. `start.sh` leaves data alone by default. Its explicitly enabled `MIGRATE_ON_START` option applies migrations only and no longer provisions an administrator. It terminates only processes it started.

The 21 native record collections load through authenticated `/api/records/<feature>` routes. Each list, detail and mutation checks the current existing account and scopes the database query to that owner before pagination. The record workspace supports draft organization and manual uploads; it does not execute AI analysis, verify law, accept court filings or grant attorney approval. Existing AI/workspace and governed navigation routes keep their original authorization and availability boundaries. Old generated `gap-*` routes remain unmounted; the legacy legal-surface switch remains disabled by default and prohibited in production.

To populate the signed-in development account, use an exact **existing** account ID or email. Supply `DATABASE_URL` through your local configuration without displaying it. From the project directory:

```sh
node server/seed.js --user-id EXISTING_ACCOUNT_ID --dry-run --json
node server/seed.js --user-id EXISTING_ACCOUNT_ID --migrate --json
node server/seed.js --user-id EXISTING_ACCOUNT_ID --count --json
```

`--email EXISTING_ACCOUNT_EMAIL` is an alternative. `scripts/seed-demo.sh` wraps the same preserving command and can load the local configuration when no connection was supplied. Inspection never writes; do not combine `--dry-run` or `--count` with `--migrate`. `--migration-only` prepares storage without adding records. Production population is refused. No account is silently created if the target is absent. The signed-in development UI's **Load 15 demo rows** action uses the current account only.

Population adds 15 stable labeled synthetic examples to each of the 21 collections (315 in an empty account), preserves every existing record and edited example, and is safe to repeat. Other accounts are untouched. The examples contain no provider responses, legal approvals, actual consent or verified legal facts. Upload examples contain actual generated text marked as a sample, not a fictitious uploaded file; real evidence still requires manual file selection. Conversation examples are empty draft threads. State law examples live in a separate draft research-template collection, with no asserted statute, citation, property rule or legal period. Calendar examples are fictional planning reminders, not hearings or sourced deadlines. Governed navigation matters, rules, documents, approvals and audit evidence are not seeded. Record edits cannot replace ownership, provider outputs, origin labels or final legal status; existing provider/final records are retained in their authorized workflows.

`/api/navigation` provides workspace-isolated matters, jurisdiction and effective-date checked rule sources, safety screening, sourced calendar-day deadline drafts, cited option explanations, and mandatory attorney review. Public registration creates a `client`; workspace roles control rule entry and review. Every persisted workflow record retains provenance.

This product provides organization and general information, not legal advice, representation, filing, deadline guarantees, or safety services. Court calendars, holidays, local rules, form versions, filing acceptance, accessibility, and attorney judgment require qualified review. Court, document-storage, e-signature, legal-aid, and secure-messaging providers remain subject to their existing availability gates and require actual authorized integrations. Do not store privileged or family-safety material with an unapproved provider.
