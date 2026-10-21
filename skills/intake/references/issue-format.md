# Issue format

Use the target repository's own issue templates (`.github/ISSUE_TEMPLATE/`),
contributing guide and instructions first. Where they are silent, write issues
in this format. It follows the Omni-Kit templates and the way its recent issues
are written, and applies to the other repositories of the workspace too.

## Title

- `<Area>: <outcome>`, imperative, sentence case, no trailing period, at most
  about 80 characters. Examples: `JSON-RPC: create, resize and move obstacles`,
  `RPC: declare each endpoint's permission with a required attribute`,
  `Create and delete storages from the UI`.
- The area is the component or interface a reader looks for (`JSON-RPC`,
  `REST`, `MCP`, `DataHub`, `Storages`, `UI`, a service name). Omit it when the
  title is clear without it.
- No conventional-commit prefix (`feat:`, `fix:`): that belongs to PR titles.
- A bug title states the wrong behaviour, for example `Storage removal ignores
  execution-node ignore lists`.

## Labels

- A type label as the repository's templates set it: `enhancement` for a
  feature request, `bug` for a defect.
- Existing area labels that clearly apply (for example `ui`, `Rest-API`,
  `user roles`, `CNC`). Read the repository's label list; never invent a
  label, except the intake draft label.
- Do not add release-note labels (`changelog/*`), milestones or assignees: the
  team decides those.

## Body of a feature or change

Write in the language of the repository's recent issues, English when unclear.
Keep it factual and short; a reader should know what to build and why after the
first two sections.

```markdown
Follow-up to #12311.                     <!-- or: Requested in owner/repo#21: …; Part of #12380. -->

## Problem

What happens today and why it is not enough, with facts: the code that
decides it as permalinks pinned to a commit of the default branch
(`develop` `d20b988`), counts ("none of the 170 JSON-RPC methods …"),
the workaround people use.

## Proposal

The intended outcome and its contract: names, request and response shapes,
error codes, where the change lives. Mark open names as open.

## Acceptance criteria

- [ ] Verifiable statements a reviewer can check, one per line.

Decide before implementing:

- **Question.** Options and the recommended answer.

## Tasks

- [ ] Omni-Kit: endpoints, tests, the `inspect-runtime` catalogue
- [ ] omnipack-mcp: sync and concept docs; then close owner/repo#21
```

- The first line gives the context link: `Follow-up to #N.`, `Requested in
  owner/repo#N: <what the user could not do>.` or `Part of #N.`
- **Problem** cites code with permalinks that include the commit SHA, never a
  branch link, and names the commit it was checked against.
- **Proposal** may give a sketch of the API or behaviour; leave implementation
  detail to the PR unless it constrains the design.
- **Acceptance criteria** are required for intake issues; deliver plans from
  them.
- **Decide before implementing** lists open product, contract or security
  decisions with a recommendation; omit it when there are none.
- **Tasks** appears only when the work spans several repositories or PRs:
  one checkbox per repository or PR, in dependency order, linking the other
  issues of the run.
- Add `## Non-goals` or `## Assumptions` only when they prevent a likely
  misunderstanding.

## Body of a bug

Use the bug template's sections and their spelling:

```markdown
### Steps to reproduce
1. …

### Actual behaviour
…

### Expected behaviour
…

### Proofs
Logs, screenshots, or the code path that shows the defect (permalinks).

### Version
1.2.3-test.4+a5b6c7d, or the commit checked.

### Platform
Linux / WebGL / iOS / Editor

### Additional context
…
```

## Umbrella issue

When one outcome needs several PRs (or extends existing issues), the parent
issue states the goal in one paragraph, then a `## Plan` checklist with one
line per PR: its issue or PR number, its future PR title in
conventional-commit form, and what it depends on. Decisions the plan waits for
are listed as `Р1`, `Р2` … (or `D1`, `D2` … in English issues) and referenced
from the plan lines.

## Intake marker

End every issue intake creates with its hidden run marker on the last line:
`<!-- intake:v1 run=RUN_ID -->`.
