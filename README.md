# ABAP Language Basics

ABAP Language Basics is a declarative Visual Studio Code extension for local
`.abap` files. It provides TextMate syntax highlighting, common ABAP 7.50
snippets, comment and bracket configuration, folding markers, and Sticky Scroll
fallback without starting a language server.

The TextMate grammar is lexical: it recognizes comments, strings, templates,
ABAP dash-composite keywords, declarations, executable reports and selection
screens, class and interface constructs, chained component declarations,
structured data and type declarations, table and reference types, OO method and
event signatures, constructor operators, Open SQL clauses, core statement
families, system fields, text symbols, and nested named/control-flow blocks. It
guards selectors such as `sy-subrc`, `lo_object->method`, and
`zif_interface~method` from partial keyword matches. It does not resolve names
or parse complete ABAP syntax.

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

When this directory is opened as the VS Code workspace, the Run and Debug view
also provides two developer workflows:

- **Run ABAP Language Basics** opens the ABAP fixtures in an Extension
  Development Host for interactive checks of highlighting, snippets, folding,
  and editor configuration. It opens `highlighting.abap` directly in a new
  window and uses project-local, ignored profile and extension directories so
  an existing host or user-installed extension cannot override the development
  grammar while VS Code's built-in themes remain available.
- **Run Extension Tests** compiles and runs the automated test suite inside an
  isolated Extension Development Host.

The matching default build and test tasks are available through **Tasks: Run
Build Task** and **Tasks: Run Test Task**. A separate **verify extension
package** task builds and validates the VSIX contents.

The TextMate grammar is loaded directly from `syntaxes/abap.tmLanguage.json`;
there is no grammar build step. Stop a running Development Host before starting
**Run ABAP Language Basics** again, because VS Code loads declarative grammar
contributions when that host starts.

`verify:package` builds the platform-neutral VSIX and checks that it contains
only the declarative runtime assets and Marketplace documentation. See
`RELEASING.md` for the tag-driven release setup.
