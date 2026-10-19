# GitHub access, snapshots, and publication

These are command shapes, not literal inputs. Substitute verified identifiers and
use quoting appropriate to the current shell. Do not interpolate PR text into shell
commands. Prefer structured tools or UTF-8 JSON/body files for user-visible prose.
Use only existing authenticated access; if writes are unavailable, finish the local
review and explain the concrete access failure without claiming to have published.

## Read a consistent snapshot

```text
gh pr view PR_URL --json number,url,title,body,author,state,headRefOid,baseRefOid,headRefName,baseRefName,changedFiles,additions,deletions
gh pr diff PR_URL
gh api --hostname HOST --paginate --slurp repos/OWNER/REPO/pulls/NUMBER/files?per_page=100
gh api --hostname HOST --paginate --slurp repos/OWNER/REPO/pulls/NUMBER/reviews?per_page=100
gh api --hostname HOST --paginate --slurp repos/OWNER/REPO/pulls/NUMBER/comments?per_page=100
gh api --hostname HOST --paginate --slurp repos/OWNER/REPO/issues/NUMBER/comments?per_page=100
```

Quote endpoint arguments when the shell requires it. `--slurp` preserves a JSON
array of pages: flatten it before selecting or counting entries. Treat absent or
truncated patches as missing coverage, not as empty changes. Compare the retrieved
file count with `changedFiles`; APIs have response caps beyond ordinary pagination.
Use Git objects at verified revisions when API limits prevent a complete diff.

Fetch a source file with the contents API at `?ref=SHA` and decode its returned
base64 content, or request raw text through a supported connector. For local reads,
use `git show SHA:path`; the working file may contain unrelated edits. For a PR's
pre-change state and local three-dot diff, establish the base/head merge base, then
compare it to head. Distinguish that revision from the current base branch tip.

Because `gh pr diff` follows a live PR, reread metadata after retrieval; retry the
snapshot if head or base changed. Immutable checkout reads and permalinks must
refer to the captured revisions, not whatever is checked out later.

## Thread history with GraphQL

Write a JSON request containing `query` and `variables` to a temporary UTF-8 file,
then run `gh api --hostname HOST graphql --input threads-query.json`. This is a read
query even though GraphQL uses HTTP POST. A suitable outer query is:

```graphql
query($owner: String!, $repo: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      headRefOid
      reviewThreads(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id isResolved isOutdated path line originalLine startLine originalStartLine
          comments(first: 100) {
            pageInfo { hasNextPage endCursor }
            nodes { id databaseId url author { login } createdAt body }
          }
        }
      }
    }
  }
}
```

Advance `$after` with the outer connection's endCursor until hasNextPage is false.
For any truncated comments connection, fetch that thread separately through
`node(id: $threadId) { ... on PullRequestReviewThread { comments(first: 100,
after: $after) { pageInfo { hasNextPage endCursor } nodes { id databaseId url
author { login } createdAt body } } } }`, declaring threadId as `ID!` and after as
`String`. Exhaust its pages too. Check GraphQL `errors` even after HTTP success.

For incremental review use `repos/OWNER/REPO/compare/LAST_SHA...HEAD_SHA`. Validate
ancestry from `merge_base_commit.sha` and comparison status or from local
`git merge-base --is-ancestor LAST_SHA HEAD_SHA`. Fetch all required commits and
account for compare-file limits; a successful but truncated response is incomplete.
Use the full current PR diff if the comparison cannot establish a complete delta.

## Prepare and validate a review

Use one review request with a nonempty summary, explicit commit, event, and comments:

```json
{
  "commit_id": "REVIEWED_HEAD_SHA",
  "body": "Prepared summary with disclosure and the run marker",
  "event": "COMMENT",
  "comments": [
    {"path": "src/example.cs", "line": 42, "side": "RIGHT", "body": "Prepared finding"},
    {"path": "src/other.cs", "start_line": 10, "start_side": "RIGHT", "line": 15, "side": "RIGHT", "body": "Prepared block finding"}
  ]
}
```

An empty comments array is valid for a clean summary-only review. Before publishing:

1. Parse the JSON with a real parser and check all required values. Use a temporary
   artifact directory so review files do not pollute the user's repository.
2. Verify every path, side, and line against the captured current PR diff. RIGHT
   numbers refer to new code; LEFT numbers to old code. A deleted-line finding
   needs LEFT. Multiline anchors include start_side and start_line and must be
   valid on the chosen side. Use a minimal same-hunk range; do not guess positions.
3. Findings without a valid diff anchor belong in the summary with a source link.
   Verify their underlying source revision too, including renamed/deleted paths.
4. Recheck the score, confidence, duplicated findings, and earlier thread history.
5. Re-fetch head/base immediately before the write. If either changed, update the
   affected analysis and anchors before submission. Explicit `commit_id` pins the
   payload, but does not make the preceding read/write sequence atomic.

## Submit and reconcile

Only when publication is explicitly authorized, use a supported write tool or:

```text
gh api --hostname HOST -X POST repos/OWNER/REPO/pulls/NUMBER/reviews --input review.json
```

Read back the created review and its comments. Check its submitted state, commit,
body, and comment count; return the actual `html_url`. A pending review has not been
published. Do not substitute a conversation comment for a review without explaining
the limitation and respecting the authorized scope.

On a timeout or ambiguous response, first list reviews and comments and match the
same run marker and expected author. Reuse that run ID; never blindly repeat a POST.
Retry a corrected validation failure once only after confirming that it created no
review. For permissions, rate limits, an unresolved publication outcome, or another
failure after that retry, preserve the prepared payload and report the status.

API details: [review requests](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request),
[commit comparison](https://docs.github.com/en/rest/commits/commits#compare-two-commits),
and [GraphQL pagination](https://docs.github.com/en/graphql/guides/using-pagination-in-the-graphql-api).
