# Run state file

Every deliver and scratch run keeps one local JSON file that describes its
current state. Tools such as the optional Agent board Paseo plugin read these
files to show the stage, score, blockers and created issues of each run next to
its agents. The file is local bookkeeping, not publication: write it in every
run, including `no-post`, `local-only` and `no-push` runs.

## Location

`~/.paseo-dev-team/runs/<run-id>.json` (`%USERPROFILE%\.paseo-dev-team\runs` on
Windows). Use the run ID from the status comment marker, or generate one in the
same way when no comment is posted. Create the folder when it is missing. Write
the whole file each time: write to `<run-id>.json.tmp` in the same folder, then
rename it over the old file, so a reader never sees a partial file.

## When to write

- First right after the target is resolved (scratch: right after launch),
  before launching any worker.
- At every stage transition that edits the status comment
  ([status-comment.md](status-comment.md)), and at every chat stage report.
- When the run stops to ask the user, and when it becomes blocked.
- Last with `state: "final"`, before the final chat report. Never leave a
  finished run `in-progress`.

## Fields

A deliver run:

```json
{
  "version": 1,
  "runId": "deliver-web-app-482-20261019-1",
  "repo": "acme/web-app",
  "kind": "pr",
  "number": 482,
  "pr": 482,
  "title": "Fix login redirect loop",
  "workspaceTitle": "Deliver web-app #482 (Fix login redirect loop)",
  "coordinatorAgentId": "0b8e5c1a-2f4d-4a6b-9c3e-7d1f2a3b4c5d",
  "worktree": "/home/me/src/web-app/.worktrees/pr-482-ready",
  "state": "in-progress",
  "round": 2,
  "stage": "re-review of a1b2c3d",
  "lastCompleted": "R1 critique: 2 blockers accepted (R1-A-F1-BLOCKER, R1-B-F2-BLOCKER)",
  "next": "Push and wait for the required checks",
  "score": 7,
  "scoreTarget": 8,
  "result": null,
  "blocker": null,
  "needsUser": null,
  "statusCommentUrl": "https://github.com/acme/web-app/pull/482#issuecomment-1",
  "startedAt": "2026-10-19T09:02:11Z",
  "updatedAt": "2026-10-19T12:34:56Z"
}
```

A scratch run uses the same fields with `kind: "scratch"`, `repo`, `number` and
`pr` set to `null`, and lists the issues it touched in `children`:

```json
{
  "version": 1,
  "runId": "scratch-20261020-1405-1",
  "repo": null,
  "kind": "scratch",
  "number": null,
  "pr": null,
  "title": "CSV export for reports",
  "workspaceTitle": "Scratch (CSV export for reports)",
  "coordinatorAgentId": "6a7b8c9d-1e2f-4a3b-8c4d-5e6f7a8b9c0d",
  "worktree": null,
  "state": "blocked",
  "round": null,
  "stage": "waiting for confirmation",
  "lastCompleted": "Published 2 draft issues, appended 1 existing issue",
  "next": "Remove the draft label and start deliver on each confirmed issue",
  "score": null,
  "scoreTarget": null,
  "result": null,
  "blocker": null,
  "needsUser": "Review the draft issues and confirm, change or cancel them",
  "statusCommentUrl": null,
  "children": [
    {
      "repo": "acme/reports-api",
      "number": 41,
      "url": "https://github.com/acme/reports-api/issues/41",
      "title": "Stream report rows as CSV",
      "role": "created",
      "state": "draft",
      "dependsOn": [],
      "deliverAgentId": null
    }
  ],
  "startedAt": "2026-10-20T14:05:00Z",
  "updatedAt": "2026-10-20T14:21:40Z"
}
```

| Field | Meaning |
|---|---|
| `version` | Always `1`. |
| `runId` | The run ID. Also the file name. |
| `repo` | `owner/name` of the target repository; `null` for scratch. |
| `kind` | `pr` or `issue` (the deliver launch target), or `scratch`. |
| `number` | Number of the launch target (the issue in issue mode); `null` for scratch. |
| `pr` | PR number once known, otherwise `null`. |
| `title` | The workspace `{summary}`: 3-6 words describing the target. |
| `workspaceTitle` | The exact Paseo workspace name of the run. |
| `coordinatorAgentId` | The coordinator's Paseo agent ID, from the `PASEO_AGENT_ID` environment variable; `null` when unavailable. |
| `worktree` | Path of the run's worktree, or `null`. |
| `state` | `in-progress` while the run works or waits for CI, `blocked` while it waits for the user or an external requirement and cannot continue on its own, `final` when it ended. |
| `round`, `stage` | The current round number (`0` for the baseline; `null` for scratch) and a short stage description, as in the chat reports. |
| `lastCompleted`, `next` | One line each, as in the status comment. |
| `score`, `scoreTarget` | Latest whole-PR review score (`null` before the first review) and the configured target. Never write a provisional score as final. |
| `result` | For `state: "final"`: `ready to merge`, `code ready; blocked by …`, `local candidate ready; PR not updated` or `incomplete`; for scratch a short summary such as `3 issues confirmed, deliver started`. Otherwise `null`. |
| `blocker` | The external requirement the run waits for, for example `approval` or `required check X failing`; otherwise `null`. |
| `needsUser` | The question or decision the run is waiting for from the user; otherwise `null`. Set `state: "blocked"` with it. |
| `statusCommentUrl` | The status comment URL once posted, otherwise `null`. |
| `children` | Scratch only: the issues the run created or appended to. `role` is `created` or `appended`; `state` is `draft`, `confirmed`, `delivering` or `cancelled`; `dependsOn` lists `owner/repo#N` keys; `deliverAgentId` is the deliver coordinator started for it. |
| `startedAt` | UTC time the run was launched, ISO 8601. Set once and keep it. |
| `updatedAt` | UTC time of this write, ISO 8601. |

Keep values short and factual. Use the same Finding IDs as the chat reports.
Do not put secrets, tokens, raw agent output or file contents in the file.
A failed write is not a blocker: report it once and continue the run.
