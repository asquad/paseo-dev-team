---
name: paseo-team
description: Route the roles of a Paseo agent team (coordinator, developer, two reviewers, scout, expert/critic) through the saved paseo-dev-team profiles. Use when delegating development, review or research to Paseo agents, or when combining the team with deliver or another workflow.
---

# Paseo Team

Run the user's requested workflow through Paseo agents with fixed roles. This
skill changes role routing, not the workflow or its authorization. A role
selection alone does not authorize code changes, GitHub publication, merges or
running a task without a target.

## Profiles

Call `list_profiles` and read the notes. Resolve each role by its profile `id`;
display names, providers and models may change. Users can assign any provider
Paseo supports to any role, so do not assume a provider, mode or capability
from the role name.

| Role | Profile id | Purpose |
|---|---|---|
| Coordinator | `team-coordinator` | Plans, delegates, integrates, owns shared Git operations and final verification. |
| Developer | `team-developer` | Implements assigned changes and tests. |
| Reviewer A | `team-reviewer-a` | Independent reviewer. |
| Reviewer B | `team-reviewer-b` | Second independent reviewer, normally on a different provider than A. |
| Scout | `team-scout` | Bounded research questions. |
| Expert | `team-expert` | Advice on hard questions; the Critic in deliver. |

Read the installed `paseo` skill for the current tool interface: find it in the
skill catalog (Paseo installs it at `~/.agents/skills/paseo/SKILL.md`). If it
is missing, report the missing dependency rather than guessing the interface.
There is no profile parameter on `create_agent`: copy the profile's provider, model,
`modeId`, `thinkingOptionId` and `featureValues` into the launch settings. Put
the actual role, task, context, file ownership or worktree, acceptance criteria,
allowed writes and output format into `initialPrompt`; profile notes are not
injected into the agent. If a profile is missing, name the missing id and point
the user to the paseo-dev-team installer instead of guessing a substitute.

A profile only applies at launch. It cannot change the provider or model of the
current conversation. If the current coordinator does not match
`team-coordinator`, prepare a compact handoff (goal, workspace, base and
candidate revisions, authorizations, findings, checks, active worker ids) and
direct the user to start a coordinator with that profile; an explicit request
for a Paseo handoff can use the paseo-handoff skill. Do not interrupt active
workers or claim a switch that did not happen.

## Team rules

- Reviews use BOTH reviewers as separate agents on the same frozen candidate,
  with the same requirements and no access to each other's initial findings or a
  desired verdict. Collect both reports, then give findings to the Expert as
  Critic in a separate session. The coordinator resolves disputes through
  evidence and never substitutes self-review.
- Reviewer, Scout and Expert assignments do not authorize source edits. State
  that in the prompt and use a read-only mode where the provider has one; notes
  alone are not a sandbox.
- Keep at most two active workers apart from the coordinator by default
  (deliver reads `maxActiveWorkers` from its config). Prefer parallel reading;
  give concurrent developers disjoint files or separate worktrees.
- Only the coordinator performs shared Git operations. Workers do not redelegate
  unless assigned.
- For PR readiness or issue delivery, follow sibling `../deliver/SKILL.md` and
  give reviewers sibling `../pr-review/SKILL.md`. For other tasks keep the
  workflow appropriate to the request; do not turn every task into deliver.

## Waiting and messaging

- While workers or CI are running, the coordinator does not end its turn. Wait
  inside the turn with bounded steps (agent status/activity, an expected handoff
  file, check polling a few minutes at a time) and short progress notes. End the
  turn only with the final report or a concrete question for the user. A turn
  that resumes on its own later does not notify the parent chat.
- Ask workers to write their final handoff to a known file and to run long
  checks in the foreground, finishing only with the final handoff. If a worker
  finishes while saying it is still waiting on something, start a bounded wait
  for its real handoff immediately; a self-resumed worker does not send a second
  finish notification.
- Sending a prompt to a running agent replaces its current turn. Prefer sending
  notes to idle agents. For a running agent phrase the note as a continuation
  ("this is not a stop; continue from where you are and also take X into
  account") and check afterwards that it resumed.
