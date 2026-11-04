# Writing and editing tgrecojs.com

Read the selected draft and the writing section of README.md before editing a post.
For a publication proofreading pass, use `.agents/skills/proofread-post/SKILL.md`.

## Author's voice and scope

The draft is the primary voice reference. Make focused edits that preserve Thomas's
reactions, examples, and opinions. Do not invent personal experiences or replace a
working paragraph merely to make it sound more polished. If more voice context is
needed, read one authored post such as `src/content/posts/getting-into-flow.mdx`.

Posts should stand alone. Do not add numbered titles, series metadata, required
reading sequences, or "stay tuned for the next post" endings unless requested.
Related-post links can be optional context once their destinations are published.
Do not rename an existing post file or change its URL just to remove a visible label.

## Editorial annotations

PFU means Prospective Future Update. Preserve every PFU comment verbatim, including
its location relative to the surrounding content, unless the author asks to change it.
These notes are deferred ideas, not publication blockers.

Treat other editorial comments as current requests. Resolve the request before
removing its comment; leave an unresolved request visible rather than silently
deleting it. Technical comments inside examples are not automatically editorial tasks.
When asked to apply marked cuts, remove struck-through prose. Do not interpret
operators or strings inside code fences as editorial markup.

## Syntax and examples

Use inline backticks for literal identifiers, type expressions, method calls, and
code values in prose. Use language-tagged fences for multiline code. Keep ordinary
concepts in prose rather than formatting every mention of a function or type as code.
Use the existing TsSandbox component for interactive examples; its sources live in
`src/sandbox`. Some examples deliberately have type errors or runtime failures.
Check their stated teaching purpose before changing them.

## Workflow

Read the current git diff and preserve unrelated edits. README.md documents preview
and test commands. Production builds exclude drafts, so separately verify draft MDX
when its markup changes. Logseq is optional context and read-only unless requested.
Keep the current draft/publication state unless the author explicitly changes it.
Do not commit, push, or deploy without explicit authorization for that action.
