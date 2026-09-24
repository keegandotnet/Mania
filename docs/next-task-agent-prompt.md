# Next task: Implement the approved Mania UI overhaul

## Status

The user approved the 12-page proposal on September 24, 2026 and requested an implementation handoff for another agent. Design and handoff are complete. Application implementation has not started.

## Authoritative task

Read and execute [UI Overhaul](../UI%20Overhaul.md). That single document contains the full scope, visual reference links, navigation contract, screen specifications, role/state matrix, preserved actions, implementation checkpoints and acceptance criteria. Use the [approved proposal PDF](../output/pdf/Mania%20UI%20Redesign%20Proposal.pdf) as the visual target.

Ship the approved overhaul as one coherent product vertical. The checkpoints organize that work; they do not limit it to a homepage or a partial Play restyle. Preserve backend rules and existing functionality. Do not repeat the completed design-discovery process or follow the archived design-only stop instructions in `UI Overhaul.txt`.

Follow `AGENTS.md`, the installed Next.js documentation and [the repository handoff workflow](../.cursor/rules/NEXT-AGENT-TASK.mdc). The user has already selected and approved this scope, so no new feature-selection discussion is necessary. Work on a dedicated implementation branch and preserve unrelated changes.

## Completion

Use the acceptance checklist in `UI Overhaul.md`, including real frontend inspection and meaningful lifecycle/permission tests. Update `docs/design.md`, `docs/ux.md`, `docs/testing.md` and `docs/roadmap.md` to reflect what actually ships. Explicitly report environment blockers or conditional data-contract limitations; do not claim static mockups prove production behavior.

The previous screenshot-only/Play-simplification brief and old branch-review dependency are superseded. Do not merge an old branch or change a live database based on that archived brief. The user controls Git publication and review.
