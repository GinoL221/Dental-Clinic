# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When building AI chat features | ai-sdk-5 | /home/gino/.config/opencode/skills/ai-sdk-5/SKILL.md |
| When creating a pull request | branch-pr | /home/gino/.config/opencode/skills/branch-pr/SKILL.md |
| When writing guides, READMEs, RFCs | cognitive-doc-design | /home/gino/.config/opencode/skills/cognitive-doc-design/SKILL.md |
| When drafting review comments | comment-writer | /home/gino/.config/opencode/skills/comment-writer/SKILL.md |
| When building REST APIs with Django | django-drf | /home/gino/.config/opencode/skills/django-drf/SKILL.md |
| When a PR would exceed 400 lines | gentle-ai-chained-pr | /home/gino/.config/opencode/skills/chained-pr/SKILL.md |
| When writing Go tests | go-testing | /home/gino/.config/opencode/skills/go-testing/SKILL.md |
| When creating a GitHub issue | issue-creation | /home/gino/.config/opencode/skills/issue-creation/SKILL.md |
| When user asks to create an epic | jira-epic | /home/gino/.config/opencode/skills/jira-epic/SKILL.md |
| When user asks to create a Jira task | jira-task | /home/gino/.config/opencode/skills/jira-task/SKILL.md |
| When user says "judgment day" | judgment-day | /home/gino/.config/opencode/skills/judgment-day/SKILL.md |
| When working with Next.js | nextjs-15 | /home/gino/.config/opencode/skills/nextjs-15/SKILL.md |
| When writing E2E tests | playwright | /home/gino/.config/opencode/skills/playwright/SKILL.md |
| When user asks to review a PR | pr-review | /home/gino/.config/opencode/skills/pr-review/SKILL.md |
| When writing Python tests | pytest | /home/gino/.config/opencode/skills/pytest/SKILL.md |
| When writing React components | react-19 | /home/gino/.config/opencode/skills/react-19/SKILL.md |
| When user says "update skills" | skill-registry | /home/gino/.config/opencode/skills/skill-registry/SKILL.md |
| When user asks to create a new skill | skill-creator | /home/gino/.config/opencode/skills/skill-creator/SKILL.md |
| When styling with Tailwind | tailwind-4 | /home/gino/.config/opencode/skills/tailwind-4/SKILL.md |
| When writing TypeScript code | typescript | /home/gino/.config/opencode/skills/typescript/SKILL.md |
| When implementing a change | work-unit-commits | /home/gino/.config/opencode/skills/work-unit-commits/SKILL.md |
| When using Zod for validation | zod-4 | /home/gino/.config/opencode/skills/zod-4/SKILL.md |
| When managing React state | zustand-5 | /home/gino/.config/opencode/skills/zustand-5/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Use issue-first workflow - reference issue numbers in PR title
- Include issue link in PR description
- PR must have at least one approving review before merge
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Keep PRs under 400 lines; if exceeded, suggest chained PRs

### comment-writer
- Be warm but direct - no fluff, no excessive praise
- Use blocking/non-blocking prefix: "🚨 Blocked by:" vs "💡 Consider:"
- Frame suggestions as invitations, not mandates
- Include code examples only when strictly necessary
- Close with clear next action or question

### cognitive-doc-design
- Lead with the answer, then explain - progressive disclosure
- Use tables, checklists, and visual hierarchy over prose
- Chunk content into 3-5 line paragraphs max
- Signpost: "TL;DR", "Key points", "Next steps" headers
- Recognition over recall: show, don't just tell

### gentle-ai-chained-pr
- If PR exceeds 400 lines, split into reviewable slices
- Each slice must be independently testable and mergeable
- Use stacked PRs to main OR feature-branch-chain strategy
- Track slices with linked issues or a meta-issue
- Ensure each PR has meaningful commit history

### issue-creation
- Title: short, specific, actionable ( imperative mood)
- Body: context + expected behavior + reproduction steps (if bug)
- Labels: at least one of: bug, feature, enhancement, documentation
- Assign to project board if exists
- Link related issues

### judgment-day
- Launch two independent agents to review the same code
- Synthesize findings - merge overlap, resolve conflicts
- Apply fixes and re-judge until both pass
- Escalate after 2 failed iterations with full report
- Use for high-stakes changes, security, or architecture

### work-unit-commits
- Structure commits as deliverable units, not file batches
- Each commit must compile and pass tests
- Commit message: "What" + "Why" (imperative mood)
- Keep commit atomic - one logical change per commit
- Group related changes in sequence with good ordering
- Include tests alongside code they verify

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| No convention files found | — | Project has no AGENTS.md, CLAUDE.md, or .cursorrules |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.