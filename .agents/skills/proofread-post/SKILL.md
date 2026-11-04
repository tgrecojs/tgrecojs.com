---
name: proofread-post
description: Proofread tgrecojs.com MDX posts for publication, resolve editorial annotations, and standardize code formatting while preserving the author's voice and PFU notes. Use for a named draft or post review, not broad rewrites or site implementation.
---

# Proofread a post

Read the repo's AGENTS.md and README.md writing section, the requested post, and
its current git diff. Review imported sandbox sources when checking claims about
their behavior. Use the draft as the primary voice reference.

## Decide what may change

- For a review request, report findings without editing. For an edit request, make
  the focused changes needed to address it. Neither mode authorizes publication.
- Inventory PFU comments before editing and compare them afterward. Preserve them
  verbatim; they are future ideas the author does not want lost during cleanup.
- Resolve each non-PFU editorial request before removing its comment. If a decision
  needs the author, report it and keep the request. Do not strip technical comments
  from code examples as though they were editorial requests.
- Apply requested strikethrough cuts only in prose. Leave the contents of code
  fences and inline-code spans intact unless a code change is requested or required.

## Check prose and code formatting

For each technical expression in prose, distinguish literal syntax from a concept.
Wrap literal identifiers, keywords used as syntax, complete type expressions, member
access, and calls in inline backticks. For example, use `readonly T[]` for the type,
`T | undefined` for the result, and `.toFixed(2)` for a call. "A readonly array" can
remain ordinary prose when it describes a concept rather than a literal type.

Use call syntax consistently for method references in prose. When the receiver is
omitted, include a leading dot and parentheses inside the backticks:
`.toUpperCase()` rather than `toUpperCase` or `.toUpperCase`. Preserve any example
arguments, as in `.toFixed(2)`. This keeps method references recognizable and
consistent throughout the post. Keep complete expressions such as
`result.toUpperCase()` intact, and do not prepend a dot to standalone functions
such as `identity` or `first`. This convention applies to prose; preserve syntax
required in code examples and type signatures.

Give multiline examples an appropriate fence language, such as js, ts, tsx, or bash.
Do not add backticks inside fences, imports, JSX attributes, or frontmatter. Check
that variable names in the explanation match the actual example. Treat this as a
semantic pass rather than a global search-and-replace.

Fix spelling, missing words, broken fragments, and duplicate explanations. Retain
the author's conversational reactions when they communicate something specific.
Keep the conclusion useful on its own; do not add hype, numbered-part labels, or a
requirement to read another post. Prefer a direct explanation of what the example
now allows the reader to understand or do.

## Verify and report

Check compiler claims and runtime claims separately. Preserve deliberately failing
examples and verify their expected failure rather than making every snippet green.
When source changes, check both its accepted uses and the mistake the post says it
rejects. Do not claim that seeing a runtime result proves static inference.

Run `git diff --check` and the repo's appropriate checks. `npm test` covers the build
and current tests; it does not render draft routes. Verify changed draft MDX through
the existing preview or a direct MDX compile. Reuse an existing dev server without
stopping a server started by the author or another task.

Finish with a brief account of substantive edits, any unresolved author decisions,
and actual verification. State whether PFU comments were preserved and whether the
post remains a draft. Leave the changes uncommitted unless authorized to commit.
