---
name: deliver
description: >-
  Take a GitHub issue or pull request to a merge-ready PR through an iterative
  cycle of reviewer, critic and developer subagents on the Paseo team, with
  short chat reports after every stage. For an issue, plan and implement it,
  open the PR, then run the same review/fix loop. For a PR, review, critique and
  fix it until the gates pass. Keeps one PR status comment with the score. Uses
  pr-review for reviews and paseo-team for roles. Not for review-only requests,
  an isolated fix without a readiness loop, or merging.
---

# Deliver

Own the task until the latest changes are independently reviewed, merge-blocking
defects are fixed, and merge requirements are verified, or a concrete external
blocker prevents further progress. Coordinate reviewer, critic and developer
subagents; do not merely return a list of proposed fixes.

## Launch

Use `/deliver <issue or PR URL>`, or the agent's own skill syntax (for
example `$deliver` in Codex). Plain
`deliver <URL>` and `#<number>` with an unambiguous repository are also valid.

1. Resolve the target and its type (see Scope). An issue runs
   [references/issue-mode.md](references/issue-mode.md) first and then the PR
   cycle below on the PR it opens. A PR runs the PR cycle directly.
2. Resolve the run configuration per
   [references/config.md](references/config.md). Values named `config.<key>`
   below come from it.
3. Read sibling `../paseo-team/SKILL.md` and use its team profiles and
   delegation rules. Do not require the user to name `paseo-team` or
   `pr-review`; load both yourself. The coordinator reads `pr-review`, including
   `references/review-format.md`, and gives the resolved skill path to each
   reviewer.
4. Use both reviewers on the same fixed candidate and the Expert as an
   independent Critic. The Developer implements accepted changes; the Scout
   handles bounded investigations. Prefer an isolated worktree for the pipeline.
5. Name the Paseo workspaces of the run from `config.workspace.title`
   (default `Deliver {repo_name} #{number} ({summary})`) as soon as the target
   is resolved, before launching any worker. `{repo_name}` is the repository
   name without the owner, for example `web-app`. `{number}` is the number of the
   launch target, the issue in issue mode, and stays the same for the whole
   run; for several targets in one run list them as `#57, #58`. `{summary}` is
   a short description of the target in 3-6 words, written in the language of
   its title, without the number or repository name; for several targets it
   describes them together. Use exactly this name, without extra words.
   - The agent that received the `/deliver` request renames its own workspace
     with `rename_workspace` (omit `workspaceId`) first, before anything else.
     This also applies when it only prepares the run and hands it to a
     coordinator in another workspace: Paseo titled its workspace from the
     launch prompt, and that is the workspace the user watches. Skip the
     rename only when `list_agents` shows agents in that workspace that are
     not part of this run, and say so in the report.
   - A coordinator started in another workspace renames that workspace the
     same way if it does not already carry the name.
   - Pass the same name as `title` to every workspace the run creates, such
     as a worktree workspace, and include it in the coordinator's assignment.
   - Without Paseo workspace tools, skip naming and say so in the baseline
     report.
6. The coordinator runs with the `team-coordinator` profile. A command does not
   change an existing session's provider or model; for a confirmed mismatch
   follow paseo-team's handoff guidance rather than claiming a switch.
7. Relay every stage result to the user's parent Paseo chat as described below.
   Worker transcripts, tool output and the round log are not substitutes.
8. With `config.statusComment` (default on), keep one status comment on the
   target PR: posted when work starts, edited per stage, finally overwritten with
   the result and the final score. Follow
   [references/status-comment.md](references/status-comment.md). Installing and
   launching this skill with that setting is standing authorization for that
   single comment and its edits only; do not ask again. Explicit local-only,
   draft-only or no-post instructions override it.

Creating, editing or explaining this skill does not launch any live task.

## Scope and authorization

- Resolve the target from its URL, repository and number, or an unambiguous
  current branch. Confirm through the API whether a number is an issue or a PR.
  If the target remains ambiguous, ask only for that missing identifier.
- Follow the user's scope and existing session authorization. Bringing a PR to
  readiness includes necessary code fixes, relevant tests, ordinary commits and
  updating that PR's source branch. An issue launch additionally authorizes the
  branch, PR and comments listed in issue-mode.md. Respect explicit local-only,
  no-commit or no-push constraints. Do not ask again before every round, fix or
  already-authorized branch update.
- Other publication still needs its own authorization. Merging, enabling
  auto-merge, posting other reviews/comments, replying as the author, resolving
  GitHub threads and submitting approvals require authorization for those
  actions. Review findings circulate internally by default. Preparing the PR
  does not authorize those actions or changing protection rules.
- Preserve unrelated local work. Prefer an isolated worktree if the checkout is
  dirty, belongs to another branch, or is being edited concurrently. Do not
  overwrite another author's remote updates or force-push without authorization.
- Never retry a GitHub create (comment, PR, issue) on an unverified failure.
  Treat an error while checking whether the object exists as unknown, not as
  absent; read back by marker or branch before creating again.

## Establish one shared baseline

Read the installed `pr-review` skill before starting a review. Discover it from
the skill catalog, or resolve the sibling `../pr-review/SKILL.md` from this skill's
directory. The usual installation is `~/.agents/skills/pr-review/SKILL.md`.
Pass its resolved path to reviewers so they can read its instructions and relevant
references. If it is missing, search for a moved installation; if unavailable,
report the missing dependency rather than claiming to have used it.

In PR mode, post the status comment ("taken into work") as soon as the PR
target, head and base are resolved, before launching reviewers. In issue mode it
is posted when the PR is opened (issue-mode.md, step 5).

Read applicable repository instructions and capture the PR's hostname, repository,
number, source branch, remote head SHA, base SHA, full change list, existing review
threads, and required checks. Prefer supported GitHub tools, otherwise authenticated
`gh`. Include merge conflicts, required approvals, and branch requirements in the
baseline. Distinguish an unavailable requirement from one that is satisfied.

Keep a compact local round log outside tracked project files. Record the remote
head, candidate revision, base, coverage, findings, decisions, patches, and check
results. Name every finding as described in Finding IDs below and record which
agent/profile each reviewer letter denotes. For each finding record the triggering
case, consequence, evidence, priority/confidence, owner, disposition, verification
revision, duplicates, and suffix changes. Existing human comments enter the same
triage process.

## Finding IDs

Name every item discovered while preparing the PR as
`R<round>-<source>-<class><number>[-BLOCKER]`, for example `R1-A-F1`, `R1-A-N2`,
`R1-A-F3-BLOCKER`, or `R2-B-Q1`.

- **Round:** `R1` is the first review of the PR head (in issue mode, of the
  first pushed candidate). Each review of a new frozen
  candidate increments it. Items captured in the baseline, such as existing human
  threads, checks that already fail or objections raised during issue-mode
  planning, use `R0`.
- **Source:** reviewers are `A` and `B` (then `C`, `D` when scopes are split),
  assigned in the baseline and fixed for the whole run. Other sources use whole
  words: `Critic` for a new problem raised during critique, `Scout` for one found
  by an investigation, `Human` for comments from people on GitHub, `CI` for failed
  local or remote checks, and `Coord` for one the coordinator finds while
  integrating or verifying.
- **Class and number:** `F` is an actionable finding (`bug`, `issue`,
  `suggestion`, `typo`), `Q` is an open `question` that needs an answer or
  investigation, and `N` is a `note` requiring no action. Numbers run sequentially
  within one round and source, shared across classes, so `R1-A-F1`, `R1-A-N2` and
  `R1-A-F3` never reuse a number.
- **`-BLOCKER`:** appended to an `F` item that meets the merge-blocker rule in
  Completion. A reviewer proposes it from its own ratings; critique/triage
  confirms or removes it, and the round log records the reason. The ID without the
  suffix is the stable key; the suffix shows the current classification.

Each source numbers its own items: give each reviewer its letter and the round in
its assignment and require these IDs in its handoff. The coordinator names Critic,
Scout, Human, CI and Coord items. Apart from the suffix, an ID never changes after
it is first reported. When the same problem is reported again, by the other
reviewer, in a later round, or after its line moves, the earliest ID (earlier
round, then source order) stays canonical. Log the other ID as its duplicate, for
example `R1-B-F2 = R1-A-F1`, and refer only to the canonical ID afterwards. A
question that turns out to hide a defect gets a new `F` item from the source that
confirmed it, linked to the question, for example `R1-Critic-F1 from R1-A-Q2`.

Use full IDs everywhere findings are referenced: agent assignments and handoffs,
critic verdicts, the round log, chat stage reports, and the final PR summary.

## Delegate bounded roles

Use actual subagents when available. Stay the coordinator: manage the baseline,
arbitrate findings, integrate patches, and verify the final PR state. Use current
subagent tools rather than creating user-visible tasks. Do not silently change
models or reasoning settings. If subagents are unavailable, disclose the limit
and perform distinct passes locally without claiming independent review.

Give each agent the PR context, exact snapshot and base, its scope, applicable
instructions, relevant prior findings, allowed writes, and expected handoff.
Agents report to the coordinator; they do not recursively start another cycle.
The coordinator relays every completed stage to the user as specified below;
internal agent messages alone do not count as a chat report.

- **Reviewers:** Apply `pr-review` to correctness, contracts, callers, failure
  paths, tests, and relevant project conventions. Return concrete findings with
  Finding IDs, evidence and calibrated ratings, plus coverage and verification
  limits. They
  do not edit code or publish reviews. For a large PR, complementary scoped
  reviews (reviewers `C`, `D`) may be added on top of the two full reviews. The
  coordinator owns complete coverage, including interactions between scopes.
- **Critics:** Independently inspect the evidence behind each finding and the
  proposed remedy. Look for false positives, misunderstood contracts, unnecessary
  scope growth, and regressions the remedy might introduce. Return `accept`,
  `reject`, or `needs-evidence` per finding ID, with code/test evidence and a
  concrete next check for uncertainty. Also challenge a clean review's coverage
  and assumptions; a critic is not required to invent an objection. Critics do not edit or publish.
- **Developers:** Implement accepted blockers and selected nonblocking fixes in
  the assigned paths. Treat a review suggestion as a hypothesis about the fix,
  not a specification that must
  be followed blindly. If code contradicts the finding, return evidence to the
  coordinator before making a speculative change. Return finding IDs addressed,
  changed files, verification commands/results, and remaining concerns. Developers
  do not independently push, rebase, merge, or change review state.

Parallelize independent reviews, investigations, and disjoint development tasks
within available slots. For shared files, serialize developers or use separate
worktrees and integrate deliberately. Assign shared configuration, lockfiles, and
test fixtures to one owner. Only the coordinator performs shared Git operations.

Commit each logically distinct change separately. Keep a fix and its directly
related tests or documentation in the same commit; do not bundle independent
fixes into one commit merely because they belong to the same PR or review round.
Plan these boundaries when assigning developer tasks, and have the coordinator
preserve them during integration and branch updates. Respect no-commit constraints.

## Repeat until the candidate converges

1. **Review a fixed candidate.** Freeze writes during review, or give reviewers
   an immutable checkout. Start with the PR head; after fixes, review the actual
   local candidate, not stale remote code. Prefer a local commit; under no-commit
   constraints use a captured diff plus all changed/new file contents and a
   reproducible snapshot identifier. Include staged, unstaged, and untracked
   task changes. Supply PR metadata separately when the candidate is not pushed.
   `pr-review` supplies review rigor and calibration; its read-only restriction
   applies to reviewers, not to the developer role in this workflow.
2. **Critique and decide.** Send findings and evidence to critics. The coordinator
   resolves disagreement by inspecting code, reproducing the case, or checking
   the actual contract, not by majority vote. A critic's rejection alone does not
   dismiss a finding. Turn material uncertainty into a bounded investigation.
   Mark duplicates and evidence-backed rejections explicitly. Separate merge
   blockers from optional improvements using the rubric below. Select worthwhile
   nonblocking fixes without turning every suggestion into mandatory work.
   Do not downgrade or defer a blocker merely to finish.
3. **Implement accepted changes.** Dispatch bounded developer tasks, integrate
   the results, and inspect the resulting diff. Fix the cause with the smallest
   coherent change. Add regression tests for meaningful behavioral defects;
   avoid tests that merely mirror trivial implementation details. Preserve the
   intended product behavior rather than suppressing checks to make them green.
4. **Run checks.** Run checks appropriate to the integrated changes and required
   by the repository. Before every push run the repository's full set of fast
   checks (formatter, linter, type check), not only the tests. After the first
   full local test run, follow `config.followUpTests`: by default later rounds
   run tests for affected areas only and report the revision of the last full
   run. Inspect failures and report what actually ran. Fixes for failed checks
   return to implementation and invalidate affected prior results.
5. **Re-review.** Mark a finding `fixed-pending-review` after a patch; only
   independent inspection/reproduction at the new candidate can mark it
   `verified-fixed`. Re-review affected behavior and interactions; keep prior
   whole-PR coverage valid only where code, dependencies, and assumptions remain
   unchanged. New defects re-enter the same cycle. At the final candidate, ensure
   at least one reviewer who did not implement the fixes assesses the complete
   integrated PR, with fresh critique of any remaining uncertainty.
6. **Update and verify the PR.** When branch updates are authorized, recheck the
   remote head, commit task changes as needed, and push the reviewed candidate to
   the verified source branch. If someone has updated it, reconcile their changes
   before proceeding and re-review the integrated result. Verify that the PR head
   matches the candidate, then inspect checks for that SHA and current merge
   requirements. Wait for the checks selected by `config.ci.wait` (for
   `required`, the checks GitHub marks required, or all checks when none are or
   that cannot be determined), excluding names matching `config.ci.skipChecks`; report excluded checks as pending or
   skipped, never as passed. For normally progressing pending CI, wait within the active
   task using bounded calls and short progress reports; do not finish just because
   only CI remains. Pending CI is not success. Any new fix, conflict resolution,
   or material base change invalidates affected review/check evidence and returns
   to the relevant step of this cycle.

## Short chat report after every stage

After baseline capture, after each issue-mode stage, and after each review, critique/triage, implementation,
check run, re-review, and remote PR verification, post a short intermediate report
in the user's chat language. Use commentary while work continues: one paragraph
or a flat list of 1-10 points, normally 3-5. Begin with the round and stage. Each
report states the result, what remains open or uncertain, and the next action.
For a Paseo team run, write each report in the coordinator's parent chat when
the stage completes, normally as 2-5 concise bullets or a short paragraph.
Use the user's chat language; the GitHub status comment follows pr-review's
publication language rules. Do not defer all progress reporting to the end.
Also edit the PR status comment at each stage transition
with the current round/stage, the last outcome and the next step, as described in
references/status-comment.md. Skip edits for unchanged polls.

Include the useful evidence for that stage, without pasting raw agent transcripts:

- Baseline: PR/revision, scope, existing blockers, planned role assignments,
  and effective configuration values that differ from the defaults, with their
  source.
- Issue intake, requirements and plan (issue mode): acceptance criteria,
  open decisions or assumptions, plan verdict from the Critic.
- PR opened (issue mode): PR link, branch, base, draft state, first candidate.
- Review/re-review: current score and coverage, new/open/verified finding IDs,
  and the one to three factors behind the verdict.
- Critique: accepted/rejected/disputed findings and the decisive reasons;
  state which findings block merge and which remain optional.
- Implementation: what changed, which finding IDs it addresses, and what still
  needs independent verification. Do not invent a new review score here.
- Checks: meaningful passed/failed/pending results and the revision they cover.
- Remote verification: pushed or local-only revision, CI/approval/merge state,
  and the next action or exact completion status.

A stage that fails or is deliberately skipped still gets a brief result and
reason. Combine reports only for stages actually completed together, naming each
stage and its outcome. Report parallel agents as one stage summary when useful,
without delaying a completed stage behind unrelated long-running work. A clean
round can skip development with a stated reason. Keep useful work moving while
agents or checks run, with a short progress update at least every 60 seconds;
do not repeatedly narrate unchanged polls. Do not ask whether to start the next
routine round. Do not create a background automation unless the user requests
later or recurring work.

## Completion and stopping conditions

Use three gates together: **mergeable review, independent verification, and
current PR requirements**. The overall score target is `config.scoreTarget`
(default **8/10**), unless the user explicitly changes it for a run. Calibrate using the
installed `pr-review` rubric in `references/review-format.md`: 7-8 means solid and
mergeable, while 9-10 is rare exemplary work. Its actual scale is 0-10. A score of
7 meets that rubric's mergeable band but does not meet the default target.
Do not optimize for 9 or 10 unless the user explicitly requests a higher target.

The score is a consistency check, not proof by itself. Calibrate from findings
and evidence before assigning it; never raise a score to end the loop or average
away a defect across reviewers. Scope-limited scores are provisional; the final
whole-PR score must assess the complete integrated candidate under the same rubric.
If that rubric changes, preserve the configured target and satisfy the installed
mergeable criteria; report any incompatibility rather than silently lowering the
target. Below the target, have the reviewer identify evidence-backed improvements
that justify the remaining score gap. Do not inflate the score or invent defects
when no justified improvement is available; report that the target remains unmet.

Classify merge blockers from the evidence and project requirements. By default,
an accepted finding with importance >= `config.blocker.importance` and confidence
>= `config.blocker.confidence` (both 7 by default) blocks merge; so
does any other confirmed must-fix regardless of its numbers. A credible unresolved
question that could reveal a blocker requires targeted investigation, not a
cosmetic score reduction or automatic dismissal. Do not manufacture certainty
just to cross a threshold. Nonblocking suggestions may remain with a short
reason. They do not lower an otherwise sound PR below the mergeable band.

End the code loop after **one clean final cycle**: complete independent review
and critic triage of the same integrated candidate, a non-provisional overall
score at or above the target, no open blockers or
unresolved material uncertainty, all selected
fixes independently verified, and relevant checks passing. Clean means no
merge-blocking findings, not necessarily zero comments. A reviewer who implemented
the fixes cannot provide their only verification. Any subsequent code change
reopens the affected gates. Do not require two consecutive clean rounds or
continue polishing merely to increase the score above the requested target.

Before declaring the PR **ready to merge**, verify all of the following for the
latest PR head and current target branch:

- The reviewed candidate is on the PR, and all relevant local/required remote
  checks have passed or have an explicitly permitted nonblocking status.
- There are no unresolved merge conflicts or open merge-blocking findings.
- Required approvals and other merge rules are satisfied; the PR is not still a
  draft. An agent's clean internal review is not a GitHub approval.

If only external requirements remain and there is no authorized action or useful
active wait that can resolve them, finish all independent work and report
**code ready; blocked by ...**, naming the missing approval, access, stalled or
unavailable CI, external service, draft transition, or required user decision.
Normal pending CI is a waiting stage, not grounds for this final status. Under a no-push
constraint, report **local candidate ready; PR not updated**, with the candidate
revision and the prepared changes. Never label unknown or inaccessible checks
as green. Do not churn through more code-review rounds while only waiting for
external requirements. Complete routine remaining actions within the existing
authorization, including marking a draft ready when that is within the requested
scope, rather than treating an action you can take as an external blocker.

For an unchanged failure, allow a bounded retry only when evidence suggests a
transient cause. If two successive rounds add no new evidence or progress on the
same issue, change the investigation strategy. If no actionable next step remains,
report the precise blocker and needed input rather than looping or claiming
completion. Honor explicit user budgets; reaching a budget is an incomplete result,
not readiness. Keep the round log sufficient to resume after a context reset.

Overwrite the status comment with the final result
described in references/status-comment.md before ending, including a truthful
blocked outcome when the run cannot reach readiness; never leave it in progress.
If publication is prohibited by a run constraint or fails, retain the prepared
summary and report that fact; do not claim it was posted or continue code
changes just to retry publication.

End with the status, PR link and verified revision, key fixes, meaningful check
results, and any remaining blocker. Give the final `pr-review` score with its
coverage limits when available and the verified status-comment URL when posted;
the score does not replace the readiness gates.
