# Temporary report retention

This workflow saves successful scheduled executions, including raw accounting responses, so an authorized operator can retrieve HTML, CSV and JSON from **Private reports**. An INCOMPLETE report can still have a successful n8n execution status. n8n history is temporary working storage; it is not an accounting archive.

## Self-hosted setup

For a dedicated pilot instance, this is a concrete starting profile to review with its operator:

```dotenv
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
EXECUTIONS_DATA_PRUNE_MAX_COUNT=10000
EXECUTIONS_DATA_HARD_DELETE_BUFFER=1
```

The profile allows up to seven days before age-based pruning. Count limits may remove older executions sooner; deletion also depends on the pruning interval and buffer. These instance-wide settings affect other workflows too. Apply them only after the operator approves the scope. Do not use the zero-retention values from the development test in a customer deployment.

The operator should export each required report promptly to approved private storage and assign someone to review an INCOMPLETE or absent report. Record who can access n8n, who exports/reviews the report, the export destination, temporary-history retention and backup retention before enabling the monthly trigger. Retention for the accounting archive is a separate customer decision.

Avoid annotating temporary executions: annotations can exclude them from automatic pruning. Waiting or running executions also require separate attention. Pruning is not secure erasure from database pages, logs, snapshots or backups. Binary storage outside the database needs its own verified configuration. See [n8n's official pruning guidance](https://github.com/n8n-io/n8n-docs/blob/main/docs/deploy/host-n8n/configure-n8n/scaling/manage-execution-data.md) and [execution settings](https://github.com/n8n-io/n8n-docs/blob/main/docs/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/executions.md).

## Reproduce the local proof

The development scripts require the isolated n8n runtime used for the existing smoke tests at `.qa/runtime/node_modules/n8n`. It is not a product dependency. Use Node 24.13.1 and n8n 2.39.6 to reproduce the recorded run.

1. Run `node scripts/n8n-schedule-smoke.mjs`. It creates a fresh `.qa/schedule-<timestamp>` directory, verifies a real scheduled synthetic execution and stops/unpublishes the workflow.
2. Run `node scripts/n8n-retention-smoke.mjs .qa/schedule-<timestamp>` using that directory. The script requires the expected synthetic credentials, inactive workflow and completed synthetic report before it copies the database.
3. n8n's own pruning timers run against the disposable copy with accelerated retention. The script checks removal of both execution and payload records, including their inline reports. It preserves the original evidence and stops its test server.

The test uses localhost ports 5698 and 5699 and must not run alongside another process using them. Only the isolated copy is pruned. A passing record is written to `release/n8n-retention-results.json`; filesystem/S3 binaries, backups, Cloud and physical secure erasure are outside that proof.

## Cloud

Cloud execution and retention remain untested. Inspect the customer's actual plan/settings and perform retrieval/deletion checks there before claiming Cloud support. Self-hosted environment variables are not a substitute for Cloud validation.
