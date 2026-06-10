# Contributing

## Human Workflow

1. Open or claim an issue before starting work.
2. Keep changes scoped to the repo responsibility described in README.
3. Use a branch named `human/<issue>-short-topic` or `agent/<issue>-short-topic`.
4. Run the repo verification before opening a PR.
5. Link the issue and include evidence in the PR body.

## Agent Workflow

Agents may claim issues labelled `agent-ready`. If an issue is ambiguous, move it to `Needs Scoping` and ask for the missing decision. Agents must not mark work done without a commit, pushed branch, PR, test output, and issue update.

## Setup

```sh
npm install
npm run build
npm test
```

## Expected Verification

```sh
npm run build && npm test
```

## Project Lanes

Backlog -> Needs Scoping -> Agent Ready -> In Progress -> Human Review -> QA -> Ready to Merge -> Done.

## Labels

- `agent-ready`
- `human-needed`
- `blocked`
- `needs-design`
- `needs-review`
- `qa`
- `release`
- `security`
- `owner:base`
