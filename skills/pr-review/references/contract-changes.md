# Contracts and compatibility

Screen every PR for interfaces consumed outside the edited implementation, including
older deployed versions and persisted data. Inspect the actual boundary, not just
whether a language symbol happens to be public.

Relevant surfaces include DTOs and serialized request/response models; OpenAPI and
generated clients; gRPC/protobuf; queue messages and event names; library APIs;
configuration and saved-data schemas; Unity serialized fields and binary layouts;
and enums or constants serialized by name or numeric value.

For each affected boundary:

1. Compare old and new definitions and the serializer/runtime settings. Check field
   aliases, explicit enum values, defaults, migrations, and compatibility adapters.
2. Find known consumers in repository documentation, `CONTRACTS.md` if present,
   callers, generated clients, or accessible related repositories. Name confirmed
   consumers; distinguish potential consumers you cannot inspect.
3. Consider old-reader/new-writer and new-reader/old-writer behavior, mixed-version
   rollout, existing persisted records, validation changes, and rollback.
4. Assess whether compatibility handling or a coordinated consumer update is part
   of the PR. An intentional versioned break is not automatically a defect.

Removal, rename, type changes, optional-to-required changes, default changes,
validation tightening, and implicit enum renumbering are common breaking changes.
Adding an optional field or appending an enum value can still break strict parsers,
exhaustive matches, and binary layouts; verify before describing it as safe.

Summarize the affected contract, known consumers, compatibility evidence, and
remaining uncertainty. Add a focused inline `issue` for an evidenced break or a
`question` when consumer behavior is necessary but unavailable. Do not assert that
a live consumer is broken merely because its repository cannot be read.

If a contract registry would resolve a recurring blind spot, mention that once as
an optional follow-up. Creating documentation or cross-repository fixes requires a
task that includes that work; it is not part of reviewing the PR.
