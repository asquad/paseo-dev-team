---
name: paseo-team
description: Select the mixed Claude/Codex or Codex-only team preset for a Paseo task and route roles through saved profiles. Use for Team mixed/codex requests or when combining a team preset with pr-ready or another workflow.
---

# Paseo Team

Select a team for the current task, then execute the user's requested workflow through Paseo. This skill changes role routing, not the workflow or its authorization. Arguments may be supplied as /paseo-team codex pr-ready <PR URL>, $paseo-team mixed <task>, or plain Team: codex. Use pr-ready for <PR URL>.

## Select a preset

- mixed: the user's Fable coordinator, Opus developer, Astra and Fable reviewers, Sonnet scout and Fable expert.
- codex: Codex for every role, including coordinator, scout and critic/expert. Both reviewers are separate Astra agents.
- Use the explicit preset in the latest user instruction, then the already selected task preset. For a new task without a selection, retain the historical mixed default. Do not infer selection from profile names you cannot observe or guess your own model.
- State the selected preset briefly and propagate Team: mixed or Team: codex in each worker assignment and handoff. A worker's role remains bounded; loading this skill does not make every worker a coordinator.
- Never alter the host default, existing profiles, provider availability or unrelated tasks merely to select a preset. In codex, do not fall back to Claude if a profile is unavailable.

## Coordinator and switching

For a fully Codex task, the user starts a new agent with **Codex / Coordinator — Astra** and supplies Team: codex. For Mixed, use **Mixed / Coordinator — Fable 5.1** with Team: mixed. Selecting a profile only applies its provider/model/mode/thinking settings; profile notes are not an injected role prompt.

Changing the task preset affects future delegations. It cannot change the provider of the current conversation or retroactively move running agents. Do not claim a Claude session has become Codex-only. If the current coordinator is confirmed to be the wrong provider, prepare a compact handoff containing the goal, selected preset, workspace, candidate/base revisions, authorizations, findings, checks and active worker IDs, and direct the user to start the matching coordinator with that briefing. An explicit request for an actual Paseo handoff can use the shared paseo-handoff skill. Preserve completed work and avoid duplicate workers; do not silently interrupt active workers. For a new task with the correct coordinator, begin without asking for confirmation.

## Resolve saved profiles

Call list_profiles and read the notes. Use these exact profiles for the selected preset; their live fields are the source of truth for launch settings.

| Role | Mixed profile | Codex profile |
|---|---|---|
| Coordinator | Mixed / Coordinator — Fable 5.1 | Codex / Coordinator — Astra |
| Developer | Mixed / Developer — Opus 5 | Codex / Developer — Astra |
| Reviewer A | Mixed / Reviewer A — Astra | Codex / Reviewer A — Astra |
| Reviewer B | Mixed / Reviewer B — Fable 5.1 | Codex / Reviewer B — Astra |
| Scout | Mixed / Scout — Sonnet 5 | Codex / Scout — Astra |
| Expert | Mixed / Expert — Fable 5.1 | Codex / Expert — Astra |

Read the sibling ../paseo/SKILL.md for the current tool interface. There is no profile parameter on create_agent: materialize provider/model, modeId, thinkingOptionId and featureValues into provider and settings. Include the actual role, context, file ownership or worktree, acceptance criteria and output format in initialPrompt. If a required profile is missing, report which one rather than guessing or mixing presets.

## Preserve the requested pipeline

For PR readiness, read sibling ../pr-ready/SKILL.md and give reviewers sibling ../pr-review/SKILL.md. Follow pr-ready's review → critique → accepted fixes → checks → re-review → remote verification cycle and its completion gates. Use BOTH selected reviewer profiles on the same frozen candidate, even when a generic workflow would allow one. Keep initial reviews independent; collect both reports, then assign the selected Expert profile as Critic in a separate session. It examines findings, remedies and coverage, including clean reviews. The coordinator resolves disputes through evidence. The selected Developer handles accepted changes, and Scout handles bounded investigations as needed.

For other tasks, keep the workflow appropriate to the request; do not turn every task into pr-ready. Team review still uses both reviewers when review is part of the requested team workflow. Keep at most two active workers by default, apart from the coordinator; additional independent work may justify more. Only the coordinator performs shared Git operations. Workers do not redelegate unless assigned. Use completion notifications rather than polling. A preset selection alone does not authorize code changes, GitHub publication, merges or running a PR task without a target.
