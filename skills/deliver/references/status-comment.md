# PR status comment

This procedure applies to every deliver run with `config.statusComment` enabled
(the default). The run keeps one comment on the target PR: it announces at the
start that the PR is taken into work, shows the current progress while the run
continues, and is finally overwritten with the result. Honor explicit no-post,
local-only or draft-only constraints. In issue mode the target PR is the one the
run opens.

The run has exactly one such comment. Every later publication edits it in place;
do not post additional progress or summary comments.

## Language and marker

Use the review language requested by the user, otherwise `config.reviewLanguage`
when it is not `auto`, otherwise the PR team's existing review language, falling
back to English. Keep this language for the whole
lifecycle of the comment.

Generate a run ID once and retain it in the round log. Start every body version
with an HTML marker carrying the actual values (no placeholders; use `-` for a
value not yet known, such as the candidate before the first fix):

```html
<!-- deliver-status:v1 run=RUN_ID source=SOURCE state=STATE head=PR_HEAD_SHA candidate=CANDIDATE_SHA base=BASE_SHA -->
```

`STATE` is `in-progress` while the run continues and `final` for the result.
`SOURCE` is `pr` or `issue-<number>`. Reuse the same run ID for retries and
resumed work. Comments with the older `pr-ready-status:v1` marker come from the
previous name of this skill; recognize them when resuming a run started before
the rename, and use the new marker for new runs.

## 1. Taken into work (start of the run)

In PR mode, publish the comment as the first GitHub action of the run, right
after the PR target, head and base are resolved and before reviewers are
launched. In issue mode, publish it right after the PR is opened. Keep it
short:

- Generated-text disclosure and that the PR is taken into work by the deliver
  pipeline (paseo-dev-team), naming the issue in issue mode.
- The PR head being worked on and the start time (UTC).
- A **Current stage** line, initially the baseline.
- That this comment will be updated with progress and replaced with the result.

## 2. Progress updates

Edit the same comment when a stage from the SKILL.md chat-report list completes
or a new one starts: new round, critique, implementation, checks, re-review,
push, CI wait, or a blocker. Do not edit on unchanged polls. Replace the whole
progress body each time rather than appending a history. Show:

- **Current stage:** round and stage, for example `R2 — re-review of a1b2c3d`.
- **Last completed:** one line with its outcome, for example the score and the
  number of accepted blockers, or the commits pushed.
- **Next:** the planned next step.
- The last update time (UTC).

Progress text must stay truthful and provisional: no readiness claim, no final
score, no raw agent output. Finding IDs may be listed when useful. A failed
progress edit is not a blocker: log it, continue the run, and retry at the next
stage with the same comment ID.

## 3. Final result (overwrite)

At the end, replace the entire comment body, including all progress text, with
the review-format summary below and set `state=final`. Do not keep the old
progress lines, a history of rounds, or an "edited" note.

Read the sibling pr-review skill and its `references/review-format.md`. Use its
0-10 integer score, evidence-based rationale, disclosure, stable code links and
coverage limits. Scale detail to the PR. Do not invent a score if no independent
review was completed; state that it is unavailable. For partial coverage, label
the score provisional and name the reviewed scope. Attribute the score to the
actual independent reviewer results. If reviewers disagree, preserve their
scores and evidence rather than average them or invent a consensus. Resolve
material disagreement through critique and inspection before asserting readiness.

Include:

1. Generated-text disclosure and a short explanation of the final PR behavior.
2. **Score: N/10**, with the 1-3 observed factors behind it and any scope limits.
   When local test runs replaced or supplemented unavailable CI, put a
   **Local tests:** passed/failed line with a small suite | passed | failed |
   skipped table right after the score, naming environment-only failures.
   In issue mode, add which acceptance criteria are covered and by which tests.
3. **Work completed:** the meaningful fixes made during this run, with finding
   IDs in the SKILL.md Finding IDs format (for example `R1-A-F3-BLOCKER`) and
   commit-pinned links where useful. Distinguish existing PR changes
   from work performed by this pipeline. State when no code fixes were needed.
4. **Verification and coverage:** actual local checks, both independent review
   results, Critic triage and CI for the named PR revision. Distinguish passed,
   failed, pending, skipped and unavailable checks; checks excluded by
   `config.ci.skipChecks` are listed as not awaited.
5. **Remaining issues / review focus:** confirmed blockers, relevant optional
   observations, missing approvals or other external requirements.
6. **Final status and revisions:** ready to merge, code ready but externally
   blocked, local candidate ready but PR not updated, or incomplete. State the
   PR head and reviewed candidate; disclose if they differ. A clean internal
   review is not a GitHub approval.

Add architecture or contract changes only when they help a human assess this PR,
as in pr-review's format. Do not paste raw agent conversations, internal logs,
unsupported test claims or a list of all intermediate rounds. Do not present a
blocked run as successful or raise a score to reach the target.

Immediately before the final edit, recheck the PR head and base. If they changed,
do not publish a stale readiness claim: reassess affected evidence or accurately
report the evaluated older revision as incomplete/blocked by the change. A run
that stops early, fails or is blocked still overwrites the comment with a
truthful final result; never leave it in `in-progress` state when the run ends.

## Publishing mechanics

Publish a top-level **PR discussion comment**, not an APPROVE or REQUEST_CHANGES
review, not inline findings, and not edits to the author's PR description.
Only the coordinator publishes. Reviewers, Critic and Developer report internally.
Keep PR hostname, owner, repository and number verified.

Create: prefer a supported GitHub connector. Otherwise write the exact Markdown
body to a local UTF-8 file under the run folder and use authenticated
`gh pr comment <verified PR URL> --body-file <path>`. Record the comment ID and
URL in the round log immediately; read it back via
`gh api repos/OWNER/REPO/issues/comments/ID`.

Update: edit only that comment ID, for example
`gh api -X PATCH repos/OWNER/REPO/issues/comments/ID -F body=@<path>`.
Preserve real newlines and avoid interpolating user-controlled text into shell
command strings.

Recovery: on resume or after an ambiguous network result, look up this run's
marker among the PR comments (including pagination) from the authenticated
posting account before creating anything. If it exists, continue editing it. If
the comment was deleted, create a new one with the current state and log the new
ID. If the lookup itself fails, the state is unknown: do not create a comment
until a lookup succeeds. Never edit another author's comment or a different run's comment.

After the final edit, read the comment back and verify its author, marker
(`state=final`), body and PR target. Finish in the Paseo chat with a concise
result and that verified URL. If publication fails, preserve the prepared body,
complete other authorized work and report the exact publication blocker. Do not
ask again for already configured publication authorization; ask only when actual
access or a new user decision is needed.
