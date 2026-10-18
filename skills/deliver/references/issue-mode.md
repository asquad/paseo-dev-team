# Issue mode

Use when the target is a GitHub issue. The goal is the same as PR mode, a PR
that passes every gate in `SKILL.md`, but the run first produces that PR.

A launch on an issue authorizes, for that issue only: creating one task branch,
committing, pushing it, opening one PR that references the issue, the status
comment on that PR, the optional link comment on the issue
(`issue.linkComment`) and marking the PR ready (`issue.markReadyWhenDone`).
It does not cover branches or PRs the run did not create (see Intake).
Everything listed as needing separate authorization in `SKILL.md` still does.

## 1. Intake

- Resolve hostname, owner, repository and issue number. A URL path with
  `/pull/` is a PR; `/issues/` may still be a PR, so confirm the type through
  the API before choosing the mode.
- Read the issue body, all comments, labels, milestone, assignees and linked
  items. Read repository instructions for branch names, commit messages, PR
  titles and bodies, labels and the base branch.
- Look for existing work: open PRs that reference or close the issue, and
  branches named after it.
  - If an open PR addresses the issue and its author is the authenticated `gh`
    user (for example a resumed run, or a PR from the user's fork), continue
    on it in PR mode and say so in the baseline report. Do not open a
    duplicate.
  - If its author is anyone else, including a bot, stop and ask with these
    options: deliver on that PR (pushes to its branch and posts the status
    comment there), review it only (nothing is published), or stop.
  - Apart from a PR continued or adopted under the two rules above, never
    push to an existing branch this run did not create (per its round log);
    choose a fresh branch name instead.
- When no existing PR is continued, check that the authenticated `gh` user can
  push to the repository: `gh repo view --json viewerPermission` must be
  `WRITE`, `MAINTAIN` or `ADMIN`. Otherwise stop and ask before planning. Do
  not fork or push to another remote without the user's explicit approval.
- If the issue is closed, or assigned to someone else with recent activity,
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
given by `issue.prState` (a ready PR only after the auto-merge check in step 6). Do not wait for slow local test suites: have the
Developer run them while you open the PR. The readiness gates still wait for
their results.

- Title and body follow repository conventions. The body explains the change,
  lists the acceptance criteria and any recorded assumptions, and references
  the issue unless repository rules say otherwise: `Closes #N` only when the
  acceptance criteria cover the whole issue, otherwise `Refs #N` with a list
  of what remains. Mark it as generated text.
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
ready for review.

Before marking the PR ready, or opening it ready, check whether auto-merge is
enabled on it or would be armed by repository automation on ready PRs. If so
and the base requires no approving review, keep the PR in draft and ask. If an
approval is required, proceed and note in the final report that approval will
merge it; that is the repository's rule, not a merge by this run.

The final status comment adds a line on which acceptance criteria are covered
and by which tests.
