---
name: scratch
description: >-
  Turn a free-form task description into GitHub issues across the repositories
  of a multi-repository workspace, publish them as drafts, and after the user
  confirms, start /deliver on each. Finds existing issues to extend instead of
  duplicating them and links dependent issues. Use when the user describes
  work in their own words rather than pointing at an issue or PR. Not for an
  existing issue or PR (use deliver), review-only requests, or merging.
---

# Scratch

Turn the user's description into well-formed issues in the right repositories,
publish them with the draft label, wait for the user's confirmation, then hand
each confirmed issue to `/deliver`. The run owns the issues it creates; the
deliver runs it starts own everything after that.

## Launch

`/scratch <description>` (`$scratch` in Codex). The description is free text and
may span several components. Launch it from the workspace root that contains
the repositories (for example the folder of all related checkouts) so the run
can inspect every component; a launch from a single repository limits the run
to that repository. Run-specific instructions in the text pass through to the
deliver runs (for example `target 9`, `no-post`, `base staging`), plus
`auto` to skip the confirmation stop (step 6).

Creating, editing or explaining this skill does not launch any live task.

## Configuration

Resolve the configuration exactly like deliver,
[../deliver/references/config.md](../deliver/references/config.md), and use
its `scratch.*` keys:

| Key | Default | Meaning |
|---|---|---|
| `scratch.draftLabel` | `draft` | Label put on every issue the run creates until the user confirms it. |
| `scratch.maxIssues` | `5` | Maximum new issues per run. A larger split stops and asks first. |
| `scratch.planCritique` | `true` | The Expert critiques the split before publication. |
| `scratch.launch` | `deliver` | After confirmation: `deliver` starts a deliver coordinator per confirmed issue; `none` only removes the draft label. |
| `workspace.title` | as deliver | The scratch workspace is named `Scratch ({summary})`. |

## Scope and authorization

Launching scratch authorizes, for this run only:

- creating the draft label in a target repository when it is missing;
- creating up to `scratch.maxIssues` new issues and editing the issues it
  created (body, title, labels, cross-links);
- one comment per existing issue it extends (step 3);
- removing the draft label from issues it created once the user confirms them;
- closing issues it created as not planned when the user cancels them;
- starting deliver coordinators on confirmed issues (`scratch.launch`).

It does not authorize editing other people's issue bodies or labels, closing
issues it did not create, assigning people, or anything deliver itself needs
separate authorization for. Never retry a GitHub create on an unverified
failure: look the object up by its run marker first (as in deliver's
SKILL.md).

## Run

Report every stage in the chat in the user's language, as deliver does, and
keep the run state file current
([../deliver/references/run-state.md](../deliver/references/run-state.md),
`kind: "scratch"`).

### 0. Start

Rename the workspace you were launched in to `Scratch ({summary})` with
`rename_workspace`, unless `list_agents` shows unrelated agents there. Write
the first run state with `state: "in-progress"` and `startedAt`.

### 1. Understand

Restate the request as concrete outcomes. Read the workspace guide (for
example the root `AGENTS.md` and its repository map) and the instructions of
every repository that could be involved. If the description is too ambiguous
to decide which outcomes or repositories are meant, stop and ask before
publishing anything; list each open question with your recommended answer.
A small gap with an obvious conventional answer becomes a stated assumption in
the issue.

### 2. Map to repositories

Decide which repository owns each part. Use the Scout for bounded questions
(where an API is produced and consumed, which component already has a
pattern). For a shared API, schema or protocol, identify the producer and each
consumer; the producer's issue comes first and the consumers depend on it.
Prefer one issue per repository and outcome; do not split work that one PR in
one repository should do.

### 3. Find existing issues

Search open issues and recently closed ones in each target repository for the
same work (`gh search issues`, titles, labels, linked PRs). For each part:

- an open issue already covers it: extend it with one comment headed
  `Additional requirements (scratch)` that lists only what is new, and record it
  as `role: "appended"`; do not change its body or labels;
- an open PR already implements it: note it and do not create an issue; the
  user can deliver on that PR;
- otherwise draft a new issue.

### 4. Draft

Write each new issue in the format of
[references/issue-format.md](references/issue-format.md): the repository's own
templates and instructions first, otherwise that format (title, labels,
Problem, Proposal, Acceptance criteria, open decisions, Tasks; the bug and
umbrella variants). In particular:

- the context line links the user's request or the parent issue;
- the problem is traced to the user's words and to code permalinks pinned to
  a commit;
- acceptance criteria are a checklist a reviewer can verify;
- the assumptions from step 1 and open decisions are stated;
- links to the other issues of this run (`Depends on owner/repo#N`,
  `Blocks …`) and to existing issues or PRs found in step 3;
- the hidden marker `<!-- scratch:v1 run=RUN_ID -->` is the last line.

When the run creates several issues for one outcome, also create an umbrella
issue in the repository that owns the main change, with the `## Plan` of the
format, unless an existing issue already plays that role.

With `scratch.planCritique`, send the split, the drafts and the dependencies to
the Expert as Critic before publishing. It checks repository ownership,
duplicates, missing consumers, criteria that cannot be verified, and splits
that are too fine or too coarse. Resolve objections by evidence, as in deliver
triage.

### 5. Publish as drafts

For each repository, make sure the draft label exists (`gh label create
<label> --color BFD4F2 --description "Created by scratch; awaiting
confirmation"` when missing). Create the issues with the label, in dependency
order, recording each number immediately in the run state (`state: "draft"`).
Then edit the bodies to fill in the cross-links whose numbers are now known.
Post the comments for appended issues.

### 6. Confirm

Unless the launch said `auto`, stop with `state: "blocked"` and `needsUser`
set, and report in the chat: a table of the issues (repository, number, title,
created or appended, dependencies) with links, and the replies you accept:

- **confirm** (all, or a list of numbers);
- **change** requests: edit the issues accordingly, report, stay blocked;
- **cancel** (all, or a list): close the created issues as not planned, remove
  the appended comments only if the user asks.

The user may also edit the issues on GitHub before confirming; re-read them
before step 7. Do not proceed on silence.

Decisions can also arrive from the Agent board plugin as messages that start
with "The user approved these issues on the Agent board", "The user rejected"
or "Change requests for the draft issues". The board has already done what the
message says (removed the draft label and started deliver, or closed the issue).
Do not repeat those GitHub actions or start deliver for those issues again:
record each one in the run state (`delivering` with its `deliverAgentId`, or
`cancelled`), apply change requests as above, and go to step 8 once no issue
of the run awaits a decision.

### 7. Start delivery

For each confirmed issue: remove the draft label (only from issues this run
created) and set its `state` to `confirmed`. With `scratch.launch: deliver`,
start one deliver coordinator per confirmed issue, in dependency order:

- Profile `team-coordinator` (read paseo-team), working directory the same
  workspace root this run was launched from, and agent title
  `Deliver {repo_name} #{number}`. Paseo records these coordinators as your
  subagents; they are independent runs, so never archive or stop them when
  this run ends or is cleaned up.
- Initial prompt: the deliver command and the issue URL, plus the
  pass-through run instructions and, for a dependent issue, one line naming
  the issues it depends on and their current PRs, for example
  `/deliver https://github.com/OWNER/REPO/issues/41 target 9. Depends on
  OWNER/OTHER#12 (PR #15).`
- Record each `deliverAgentId` and set `state: "delivering"`.

Appended issues are delivered the same way when the user confirms them; their
labels are left alone. Do not wait for the deliver runs; they report on their
own.

### 8. Finish

Write the final run state (`state: "final"`, `result` summarising confirmed,
cancelled and started issues) and end with a short report: the issues with
links, which deliver runs were started, and anything left in draft.
