# Agent Instructions

You are working in `goblintown-base`. This repo belongs to `goblintown-labs` and is part of the new upstream.

## Claim Rules

- Only take issues labelled `agent-ready` or directly assigned to you.
- Comment when you start: branch name, intended files, and verification command.
- Move the issue/project card to `In Progress` when work begins.
- If product intent is unclear, move to `Needs Scoping` and ask one concrete question.
- Do not touch `0xbl33p/goblintown`; it is external history.

## Close Checklist

Before saying done, provide all of this in the linked issue or PR:

- Branch name
- Commit SHA
- PR URL
- Files changed
- Verification commands and results
- Remaining risk or explicit "none"

## Commands

```sh
npm install
npm run build
npm test
```

## Evidence Format

```text
scope: <what changed>
branch: <branch>
commit: <sha>
pr: <url>
commands: <commands run>
evidence: <short output summary>
next lane: Human Review | QA | Done
```
