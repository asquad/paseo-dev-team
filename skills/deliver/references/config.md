# Configuration

Resolve the run configuration once, during the baseline, and record the
effective values and their sources in the round log. Do not re-read the files
later in the run.

## Sources and precedence

Later sources override earlier ones key by key; nested objects merge, arrays
replace:

1. `config/defaults.json` next to this skill's `SKILL.md`.
2. The user file: `$PASEO_DEV_TEAM_CONFIG` when set, otherwise
   `~/.config/paseo-dev-team/config.json` on every OS (on Windows
   `%USERPROFILE%\.config\paseo-dev-team\config.json`).
3. The target repository file `.paseo-dev-team.json` at the repository root.
   In PR mode read it from the PR's base revision, not from the PR head, so a
   PR cannot relax its own gates. In issue mode read it at intake from the head
   of the repository's default branch and record that SHA; a different
   `issue.baseBranch` does not cause a second read. It may tighten or relax
   gate values for that repository only. For `statusComment`,
   `issue.linkComment`, `issue.prState` and `issue.markReadyWhenDone` it can
   only reduce publication (`false`, or `draft`): it cannot enable what the
   defaults and the user file leave off.
4. Explicit instructions in the launch or later in the run, for example
   `no-post`, `local-only`, `target 9`, `base staging`, `ready PR`.

A missing file is normal. An unreadable or invalid file is reported once in the
baseline report and ignored; do not guess its intent. Unknown keys are reported
and ignored.

## Keys

| Key | Default | Meaning |
|---|---|---|
| `statusComment` | `true` | Keep one status comment on the PR (see `status-comment.md`). `false` behaves like `no-post` for that comment only. |
| `scoreTarget` | `8` | Minimum final overall score on the pr-review 0-10 scale. |
| `blocker.importance` / `blocker.confidence` | `7` / `7` | An accepted finding at or above both values blocks merge. |
| `maxActiveWorkers` | `2` | Active workers apart from the coordinator. |
| `reviewLanguage` | `auto` | Language of GitHub text. `auto` follows pr-review's language rules. Chat always follows the user. |
| `ci.wait` | `required` | Which remote checks to wait for: `required` (the checks GitHub marks required for the PR, `gh pr checks <n> --required`; when there are none or they cannot be determined, behaves like `all`), `all`, or `none` (report pending checks without waiting). `ci.skipChecks` applies to each. |
| `ci.skipChecks` | `[]` | Regular expressions matched against check names. Matching checks are not waited for and are reported as pending or skipped, never as passed. Example: `["^build-"]` for slow player builds. |
| `followUpTests` | `affected` | After the first full local run, later rounds run tests for affected areas plus fast checks; `full` reruns everything. Report the revision of the last full run. |
| `issue.baseBranch` | `repo-default` | Base for a new PR in issue mode. `repo-default` follows repository instructions, then the GitHub default branch. |
| `issue.prState` | `draft` | `draft` or `ready` when the PR is first opened. |
| `issue.markReadyWhenDone` | `true` | Mark the draft ready for review once the code gates pass. |
| `issue.planCritique` | `true` | Send the implementation plan to the Critic before development. |
| `issue.linkComment` | `true` | Post one short comment on the issue linking the new PR. |
| `scratch.draftLabel` | `draft` | Label scratch puts on the issues it creates; it marks them as not reviewed yet. Deliver stops and asks before working on an issue that still carries it. |
| `scratch.maxIssues` | `5` | Maximum new issues per scratch run. |
| `scratch.planCritique` | `true` | The Expert critiques the scratch split before publication. |
| `workspace.title` | `Deliver {repo_name} #{number} ({summary})` | Name of the coordinator's workspace and of every workspace the run creates. Placeholders: `{number}` (issue or PR number of the launch target; several as `#57, #58`), `{summary}` (3-6 word description of it), `{kind}` (`PR` or `Issue`), `{repo_name}` (repository name without the owner, e.g. `web-app`). |

## Example user file

```json
{
  "ci": { "skipChecks": ["^build-"] },
  "reviewLanguage": "en"
}
```
