# Database

AI Converter uses Cloudflare D1. Keep it.

## Why It Exists

D1 stores small workflow records, not uploaded files:

- job ID and token hash
- conversion status
- selected plan and estimated pages
- R2 source/result object keys
- row count and confidence
- Dodo payment, webhook, refund, and retry state
- rate-limit and same-file preview protection
- support requests

Uploaded files and generated CSV/JSON files live in private R2, not in D1.

## Live Database

- Database name: `aiconverter`
- Database ID: `376080eb-60f1-4bb8-aabb-06622acabb63`
- Bound as: `AICONVERTER_DB`

## Checks

List remote migration state:

```bash
npm run db:migrations:list
```

List remote tables:

```bash
npm run db:tables
```

Apply remote migrations:

```bash
SAFE_DEPLOY_APPROVED='d1 migrations apply aiconverter --remote' npm run db:migrate:remote
```

## Restore From The Weekly Backup

`Nishfleet/drive`'s `d1-export.yml`, on branch `fleet-product-db-backups`,
dumps this database every Monday at 05:37 UTC, or on demand with
`gh workflow run d1-export.yml -R Nishfleet/drive --ref fleet-product-db-backups`.
It keeps the sealed dump 90 days (`retention-days: 90`) as the artifact
`d1-backup-aiconverter`. aiconverter-app#290 brings the same job here, and
once it has run here, `repo` in the drill below becomes this repository. D1
Time Travel keeps 30 days
([docs](https://developers.cloudflare.com/d1/reference/time-travel/)), so the
artifact is the copy that outlives it: a restore older than 30 days, a
dropped database, or a loss on Cloudflare's side.

The private key is not in this repository. It is
`~/.config/drive/d1-backup-key.txt` on the fleet host, mode 0600: the private
half of the `AGE_RECIPIENT` public key in `d1-export.yml`. The key's record is
fleet-ops#10829. The drill runs on that host, because nowhere else has the
key.

Drill a real artifact into a scratch database, from a checkout of this
repository, so the dump is known readable before anyone needs it. Re-run it
after any change to `d1-export.yml`. Never drop `--local`: the same import
without it writes these rows into the live database. The scratch database is
local on purpose, so a drill never copies customer rows into a second
Cloudflare database.

```sh
(
set -euo pipefail             # a failed fetch, decrypt or count stops the drill
umask 077                     # the dump holds uploaded bank statements
run=40850793877               # gh run list -R Nishfleet/drive --workflow d1-export.yml --branch fleet-product-db-backups
repo=Nishfleet/drive          # this repository once #290 has run
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
gh run download "$run" -R "$repo" -D "$work" -n d1-backup-aiconverter
age -d -i ~/.config/drive/d1-backup-key.txt -o "$work/aiconverter.sql" \
  "$work"/aiconverter-*.sql.age
gh run view "$run" -R "$repo" --log \
  | grep -F "$(sha256sum "$work/aiconverter.sql" | cut -d' ' -f1)"
npx --yes wrangler@4.135.0 d1 execute aiconverter --local \
  --persist-to "$work/state" --file "$work/aiconverter.sql" -y
sqlite3 "$work/dump.db" < "$work/aiconverter.sql"
test "$(sqlite3 "$work/dump.db" 'PRAGMA integrity_check')" = ok
d1=$(ls "$work"/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite | grep -v metadata)
# the export carries app tables only: _cf_METADATA is D1's own bookkeeping
tables="SELECT name FROM sqlite_master WHERE type='table'
    AND name NOT LIKE 'sqlite_%' AND name <> '_cf_METADATA'"
test "$(sqlite3 "$work/dump.db" "$tables")" = "$(sqlite3 "$d1" "$tables")" \
  || { echo "the dump and the scratch D1 hold different tables"; exit 1; }
for t in $(sqlite3 "$work/dump.db" "$tables"); do
  test "$(sqlite3 "$d1" "SELECT COUNT(*) FROM \"$t\"")" \
    = "$(sqlite3 "$work/dump.db" "SELECT COUNT(*) FROM \"$t\"")" \
    || { echo "count mismatch: $t"; exit 1; }
done
echo "restore drill: row counts match on every app table"
rm -rf "$work"; trap - EXIT   # the ciphertext is the artifact
)
```

The `sha256sum` covers the plaintext dump, `aiconverter-<date>.sql`, so a
match means these bytes are the ones that run sealed, and a log fetch that
fails fails the shell rather than looking like a mismatch. A run whose log
has expired cannot be checked this way: skip that line, because the counts
below do not need the log. A run from this repository has no plaintext
digest to check either: the job logs only the sealed file's digest, because
a public Actions log should not carry a digest of the plaintext dump. When
the run under test is one of those, remove the grep line from the block
before running it. The counts below are the check. The dump carries its own schema, so the fresh
`--persist-to` directory needs no migration step, and the block then proves
that every table in the dump exists in the scratch D1 with the same row
count. The first table that differs stops it, and that is a dump that did not
land or an exporter whose shape changed: do not import that dump anywhere
else. The plaintext is the customer data, so the block deletes it at the end
and the `trap` deletes it on any early exit.

Rebuilding the live database from a dump is a separate and destructive
decision, not this procedure.

## Rule

Do not replace D1 with Supabase/Postgres until the app needs relational complexity D1 cannot comfortably handle. For the current preview-payment-redo workflow, D1 is the right size.
