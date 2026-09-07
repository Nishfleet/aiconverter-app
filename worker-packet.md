Goal: Improve the Formats route's blank-first-paint behavior so a slow or assistive visitor sees useful truthful content before hydration, without changing conversion behavior.

Owned files: public/formats/index.html; tests/seo-static-regression.test.mjs only.

Constraints: Work from origin/main. Do not touch pricing, payments, auth, deployment config, dependencies, lockfiles, migrations, secrets, or product runtime code. Preserve the existing truth boundary and claims. Keep the static page independently useful if JavaScript is delayed or unavailable. Do not invent route availability.

Acceptance: Make the smallest high-quality static first-paint improvement supported by the existing page and tests. Add or adjust a focused regression assertion if needed. Preserve one H1, crawler-visible copy, metadata, internal links, external references, and accessible semantics. Do not merely add a spinner or hide content.

Validation: run /home/nish/.local/bin/test-gate bash -c 'npm run check:pricing && node --test tests/*.test.mjs && npm run build'; run sgscan against the changed surface if available; run git diff --check. Report exact files and results. Do not deploy or open a PR.