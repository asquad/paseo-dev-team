---
name: deliver-from-scratch
description: >-
  Turn a free-form task description into GitHub issues with scratch, confirm
  them with the user, then start /deliver on each confirmed issue. Use when the
  user describes work in their own words and wants it delivered, not only
  written up as issues. Not for an existing issue or PR (use deliver), for
  issues only (use scratch), or merging.
---

# Deliver from scratch

Combine two skills in one run: [scratch](../scratch/SKILL.md) writes the
issues, the user confirms them, and each confirmed issue goes to its own
[deliver](../deliver/SKILL.md) run. This run coordinates the hand-off; it
never implements anything itself, and the deliver runs own everything after
they start.

## Launch

`/deliver-from-scratch <description>` (`$deliver-from-scratch` in Codex).
Launch it from the workspace root that contains the repositories, as for
scratch. Run-specific instructions in the text pass through to the deliver
runs (for example `target 9`, `no-post`, `base staging`); `auto` skips the
confirmation stop (step 2).

Creating, editing or explaining this skill does not launch any live task.

## Configuration

Resolve the configuration like deliver
([../deliver/references/config.md](../deliver/references/config.md)). The
`scratch.*` keys apply to step 1.

## Scope and authorization

Launching this skill authorizes everything a scratch launch does, and in
addition, for this run only:

- closing issues this run created as not planned when the user cancels them;
- starting one deliver coordinator per confirmed issue.

Each deliver run then has the authorization of a deliver launch on its issue.
Nothing else: no merging, approving, or editing other people's issues.

## Run

Report every stage in the chat in the user's language and keep one run state
file current ([../deliver/references/run-state.md](../deliver/references/run-state.md),
`kind: "scratch"`, a run ID starting with `deliver-from-scratch-`).

### 1. Scratch

Read [../scratch/SKILL.md](../scratch/SKILL.md) and follow its steps 0-5 in
this agent: rename the workspace to `Scratch ({summary})`, understand the
request, map it to repositories, extend existing issues, draft and publish the
issues. Do not finish the run as scratch's step 6 does.

### 2. Confirm

Unless the launch said `auto`, stop with `state: "blocked"`,
`stage: "waiting for confirmation"` and `needsUser` set, and report in the
chat: a table of the issues (repository, number, title, created or extended,
dependencies) as Markdown links, the suggested delivery order, the open
decisions, and the replies you accept:

- **confirm** (all, or a list of numbers);
- **change** requests: edit the issues accordingly, report, stay in this step;
- **cancel** (all, or a list): close the created issues as not planned; leave
  comments on extended issues unless the user asks to remove them.

The user may edit the issues on GitHub before confirming; re-read them before
step 3. Do not proceed on silence.

Decisions can also arrive from the Agent board plugin as messages that start
with "The user approved these issues on the Agent board" or "The user rejected".
The board has already done what the message says (started deliver, or closed
the issue). Do not repeat those actions: record each issue in the run state
(`delivering` with its `deliverAgentId`, or `cancelled`) and continue with the
issues still awaiting a decision.

### 3. Deliver

Start one deliver coordinator per confirmed issue, in dependency order:

- Profile `team-coordinator` (read paseo-team), working directory the
  workspace root this run was launched from, agent title
  `Deliver {repo_name} #{number}`. Paseo records these coordinators as your
  subagents; they are independent runs, so never archive or stop them when
  this run ends or is cleaned up.
- Initial prompt: the deliver command and the issue URL, the pass-through run
  instructions, and for a dependent issue one line naming the issues it
  depends on and their current PRs, for example
  `/deliver https://github.com/OWNER/REPO/issues/41 target 9. Depends on
  OWNER/OTHER#12 (PR #15).`
- Record each `deliverAgentId` and set the issue's `state` to `delivering`.

Do not wait for the deliver runs; they report on their own.

### 4. Finish

Write the final run state (`state: "final"`, `result` summarising delivered,
cancelled and remaining issues) and end with a short report: the issues as
links, which deliver runs were started, and anything left undecided.
