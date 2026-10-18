# Changelog

## Unreleased

- Renamed the repository from `pr-ready` to `paseo-dev-team` and the skill
  from `pr-ready` to `deliver`.
- `deliver` accepts an issue: intake, requirements check, critic-reviewed plan,
  implementation, early PR, then the same review loop.
- Bundled `pr-review` and `paseo-team` with the workflow.
- Added the team profiles (`team-*` ids, model-independent names) and the
  orchestration prompt block.
- Added a configuration file with personal and per-repository overrides;
  the status comment, score target 8 and blocker thresholds are now defaults.
- Folded operational rules into the skills: CI check filters, affected-only
  follow-up tests, local test results in the summary, waiting inside the
  coordinator turn, safe GitHub create retries.
- Removed the Codex-only team preset.
- Added cross-platform installer with update, uninstall and legacy migration.

## 2026-10-07

- First version of the `pr-ready` skill.
