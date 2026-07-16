# ABAP Language Basics

ABAP Language Basics is a declarative Visual Studio Code extension for local
`.abap` files. It provides TextMate syntax highlighting, common ABAP 7.50
snippets, comment and bracket configuration, folding markers, and Sticky Scroll
fallback without starting a language server.

The TextMate grammar is lexical: it recognizes comments, strings, templates,
ABAP dash-composite keywords, declarations, executable reports and selection
screens, class and interface constructs, chained component declarations,
structured data and type declarations, table and reference types, constructor
operators, Open SQL clauses, core statement families, system fields, text
symbols, and nested named/control-flow blocks. It guards selectors such as
`sy-subrc`, `lo_object->method`, and `zif_interface~method` from partial keyword
matches. It does not resolve names or parse complete ABAP syntax.

Without a document-symbol provider, Sticky Scroll falls back to the language's
folding markers. Named units and `IF`, `CASE`, `DO`, `WHILE`, `LOOP`, `TRY`, and
`SELECT` can therefore all appear as sticky headers. This package contains no
extension runtime, scanner, external executable, network access, or workspace
analysis.

Install the separate **ABAP LSP** extension when diagnostics, navigation,
semantic tokens, context-aware completion, or parser-backed document symbols
are required.

## Development

Install the locked development dependencies and run the VS Code-host tests:

```sh
npm ci
npm test
npm run verify:package
```

`verify:package` builds the platform-neutral VSIX and checks that it contains
only the declarative runtime assets and Marketplace documentation. See
`RELEASING.md` for the tag-driven release setup.
