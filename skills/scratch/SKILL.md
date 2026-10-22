---
name: scratch
description: >-
  Turn a free-form task description into GitHub issues across the repositories
  of a multi-repository workspace and publish them for the user to review. Finds existing issues to extend instead of duplicating them and links
  dependent issues. Does not start any work on them. Use when the user describes
  work in their own words rather than pointing at an issue or PR. Not for an
  existing issue or PR (use deliver), implementing anything, or merging.
---

# Scratch

Turn the user's description into well-formed issues in the right repositories
and publish them. That is the whole run: it never starts `/deliver` or any
other work on them and never writes code. The user reviews the issues and
decides what goes to work, by running `/deliver` themselves or through a tool
such as the Agent board plugin.

## Launch

`/scratch <description>` (`$scratch` in Codex). The description is free text and
may span several components. Launch it from the workspace root that contains
the repositories (for example the folder of all related checkouts) so the run
can inspect every component; a launch from a single repository limits the run
to that repository.

Creating, editing or explaining this skill does not launch any live task.

## Configuration

Resolve the configuration exactly like deliver,
[../deliver/references/config.md](../deliver/references/config.md), and use
its `scratch.*` keys:

| Key | Default | Meaning |
|---|---|---|
| `scratch.maxIssues` | `5` | Maximum new issues per run. A larger split stops and asks first. |
| `scratch.planCritique` | `true` | The Expert critiques the split before publication. |
| `workspace.title` | as deliver | The scratch workspace is named `Scratch ({summary})`. |

## Scope and authorization

Launching scratch authorizes, for this run only:

- creating up to `scratch.maxIssues` new issues and editing the issues it
  created (body, title, labels, cross-links);
- one comment per existing issue it extends (step 3);
- later edits to the issues it created when the user asks for changes (step 7).

It does not authorize starting deliver or any other agent work on the issues, closing issues, editing other people's issue bodies
or labels, or assigning people. Never retry a GitHub create on an unverified
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

### 5. Publish

Create the issues in dependency order, recording each number immediately in
the run state (`state: "published"`).
Then edit the bodies to fill in the cross-links whose numbers are now known.
Post the comments for appended issues.

### 6. Finish

Write the final run state (`state: "final"`, `result` such as
`3 issues published, 1 extended`, every issue in `children` with
`state: "published"`) and end with a short report: a table of the issues
(repository, number, title, created or extended, dependencies) as Markdown
links, the order in which they can be delivered, and the open decisions the
user should settle while reviewing.

Do not wait for a reply and do not start any work on the issues.

### 7. Change requests

The user may come back to this chat, or send a message through the Agent
board starting with "Change requests for the issues", to change the
split or the wording. Re-read the issues first (the user may have edited them
on GitHub), apply the requested changes to the issues this run created or
extended, update the run state (`updatedAt`, `lastCompleted`) and report what
changed. Requests to start work are out of scope: point the user to running
`/deliver`, or to the Agent board.
