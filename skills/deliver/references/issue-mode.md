# Issue mode

Use when the target is a GitHub issue. The goal is the same as PR mode, a PR
that passes every gate in `SKILL.md`, but the run first produces that PR.

A launch on an issue authorizes, for that issue only: creating one task branch,
committing, pushing it, opening one PR that references the issue, the status
comment on that PR, the optional link comment on the issue
(`issue.linkComment`) and marking the PR ready (`issue.markReadyWhenDone`).
Everything listed as needing separate authorization in `SKILL.md` still does.

## 1. Intake

- Resolve hostname, owner, repository and issue number. A URL path with
  `/pull/` is a PR; `/issues/` may still be a PR, so confirm the type through
  the API before choosing the mode.
- Read the issue body, all comments, labels, milestone, assignees and linked
  items. Read repository instructions for branch names, commit messages, PR
  titles and bodies, labels and the base branch.
- Look for existing work: open PRs that reference or close the issue, and
  branches named after it. If an open PR already implements it, switch to PR
  mode on that PR and say so in the baseline report. Do not open a duplicate.
  If the issue is closed, or assigned to someone else with recent activity,
  stop and ask.
- Record the base branch (`issue.baseBranch`) and its SHA.

## 2. Requirements

Write down, in the round log, the acceptance criteria you will implement, each
traced to the issue text or comments, plus explicit non-goals.

If a criterion needs a product, design or contract decision the issue does not
make, stop before writing code and ask the user, listing each open decision
with your recommended answer. Do not invent requirements to keep moving. A
small gap with an obvious conventional answer is recorded as an assumption
and listed in the PR body instead.

## 3. Plan

Have the Scout answer bounded questions (callers, existing patterns, tests to
extend) when needed. The coordinator writes a short plan: files to change,
approach, tests to add, risks, and how the change will be split into commits.

With `issue.planCritique`, send the plan and the requirements to the Expert as
Critic. It returns accept, reject or needs-evidence per plan item. Resolve
objections by evidence before development, as in PR-mode triage. Report the
result as the plan stage.

## 4. Implement

- The coordinator creates an isolated worktree and the task branch from the
  recorded base SHA, following repository branch naming, otherwise
  `<issue-number>-<short-slug>`.
- The Developer implements the accepted plan with tests, in that worktree, and
  runs the repository's fast checks (formatter, linter, type check).
- The coordinator inspects the diff against the requirements and commits each
  logically distinct change separately.

## 5. Open the PR early

As soon as fast checks pass, push and open the PR into the base in the state
given by `issue.prState`. Do not wait for slow local test suites; run them in
the background and fold their results in later.

- Title and body follow repository conventions. The body explains the change,
  lists the acceptance criteria and any recorded assumptions, and contains a
  closing reference (`Closes #N`) unless repository rules say otherwise.
  Mark it as generated text.
- Post the status comment on the new PR (it starts at `R1 — review`) and, with
  `issue.linkComment`, one short comment on the issue linking the PR.
- Record the PR URL and number in the round log immediately; on resume, find
  the PR by branch before creating anything.

## 6. Review loop

Continue with the PR-mode cycle in `SKILL.md`. `R1` reviews this first
candidate. In addition to the usual scope, reviewers check the change against
the recorded acceptance criteria and non-goals; a missing criterion is a
finding.

When the code gates pass and `issue.markReadyWhenDone` is set, mark the draft
ready for review. If repository automation arms auto-merge on ready PRs, note
that in the final report; it is the repository's rule, not an extra merge by
this run.

The final status comment adds a line on which acceptance criteria are covered
and by which tests.
