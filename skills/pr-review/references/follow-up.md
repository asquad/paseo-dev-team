# Follow-up review

Use after identifying prior review state. Reuse project context and the rubric in
[review-format.md](review-format.md). Settle prior findings and examine subsequent
changes, keeping the result comparable to the previous pass.

## Establish the baseline

Fetch complete prior reviews and discussions. Select the latest relevant submitted
review by timestamp, retaining its ID, URL, `commit_id` as LAST_SHA, score, and base
SHA if its marker recorded one. Include unresolved findings from earlier passes;
the newest follow-up body may not repeat every original inline comment. A draft
that was never published is a baseline only if its artifact and reviewed SHA are
available and the user is following up that draft.

Fetch review threads with resolution state, outdated state, original/current line
coordinates, comment IDs/URLs, authors, timestamps, bodies, and replies. The REST
PR review-comments response does not provide resolution state. Use an available
GraphQL-capable tool or `gh api graphql` when this state matters. Paginate both
`reviewThreads` and each thread's `comments`; first 100 threads or first 20 replies
are not a complete history. See [github.md](github.md) for a query shape.

If only REST access is available, analyze the accessible comments, replies, and
current code, and explicitly mark thread-resolution metadata unavailable. Missing
resolution metadata alone need not block verification of a fix.

Compare LAST_SHA to the captured current head. Verify that LAST_SHA is an ancestor
of head before treating a three-dot compare as the exact delta. A force push can
leave LAST_SHA accessible while changing the merge base. If ancestry cannot be
established, history diverges, the compare is incomplete, or the relevant base
changed, review the current PR diff in full and explain that fallback. Do not infer
force-push as the cause of every API error; access failures and rate limits differ.

## Settle every earlier finding

| State | Required evidence |
|---|---|
| Fixed | Current code, callers, or a verified contract now address the original trigger |
| Still open | The original trigger remains; no adequate fix or reasoned disposition |
| Declined | The author explicitly chooses not to change it and gives a reason |
| Withdrawn | New evidence shows the earlier claim or assumption was wrong |
| Unverifiable | Necessary code, behavior, or evidence is unavailable |

Neither `isResolved` nor `isOutdated` proves a fix. An outdated thread may have null
current coordinates; use original coordinates and code history to locate the
behavior. The fix may be in a caller or invariant rather than at the original line.
A partial or unsuccessful fix remains open, with an explanation of what remains.

Record a reasoned decline once, in the author's terms. Do not repost it in later
passes unless materially new evidence or an explicit reconsideration request
justifies reopening it. A declined risk can still affect the current score; the
author's acceptance of risk is not proof that the behavior changed. A correction
of your own false positive is withdrawn, not an author refusing to fix a defect.

Keep importance stable unless code or new evidence changes the consequence.
Update confidence when replies establish or refute an assumption. Do not repeat
an uncertain earlier assertion as fact merely because it was previously posted.

## Review the new state

Inspect the delta and effects of attempted fixes with the same care as the initial
review. Label newly discovered findings in unchanged PR code `missed in the previous
pass`. Keep unrelated pre-existing repository problems outside the PR's findings.

Derive the score from current evidence using the shared rubric. Explain what moved
it. If code and evidence are unchanged, retain it and keep the update short. Author
replies or withdrawn findings can justify changing the score even without a commit.
If neither code, discussion, nor findings changed, report that in chat; do not publish
an identical follow-up unless the user explicitly requests such a status comment.

## Follow-up summary and publication

Begin with the identity disclosure and a fresh run marker, then include:

- A short explanation of changes since the baseline, with its review link and SHAs.
- `Score: N/10 (was M)` and the evidence behind the change or unchanged result.
- Key changes since the last pass when the delta needs a table. For structural
  changes, use LAST_SHA as the before-state when the history supports that comparison.
- Nonempty lists for Fixed, Still open, Declined, Withdrawn, Unverifiable, and New.
  Link fixed behavior to current code and open findings to existing threads.
- Contract changes, review focus, and verification limits when relevant.

List open and new findings by consequence. Keep importance/confidence ratings on
inline comments only. Do not repost still-open findings as new inline threads.
Only new findings get new inline comments, anchored to the current PR diff even
when the analysis used a separate incremental diff. Publication follows the same
authorization and verification rules as an initial review.
