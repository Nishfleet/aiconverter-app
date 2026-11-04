# verify: the AI Converter verification skill

`SKILL.md` tells an agent how to launch the app, check it is healthy, drive each feature and keep the evidence. `features/` is the feature map: one file per thing a user can do, with how to reach it and what proves it works.

## Keeping it true

- Whoever ships or changes a feature updates its file in `features/` in the same PR.
- Run `/maintain-verification-skill` (pstack) after a batch of changes. It reads the code for each feature, drives every feature in one live session, and opens at most one PR of proven corrections.

## Switch it off

Delete this folder. Nothing else imports it.

Source: pstack `/create-verification-skill` and `/maintain-verification-skill` (https://github.com/cursor/plugins).
