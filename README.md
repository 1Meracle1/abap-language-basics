# ABAP Language Basics

ABAP Language Basics is a lightweight, declarative Visual Studio Code extension
for local ABAP `.abap` and ABAP CDS `.ddls` files. It provides broad TextMate
syntax highlighting, common ABAP 7.50 snippets, folding, comments, brackets, and
Sticky Scroll support without starting a language server.

## Language Coverage

### ABAP

The ABAP grammar recognizes the syntax used across reports, classes,
interfaces, function modules, includes, and executable code, including:

- declarations for data, constants, field symbols, parameters, select options,
  structured types, internal tables, references, methods, events, interfaces,
  and aliases;
- class and interface definitions and implementations, method signatures,
  constructor expressions, procedure calls, and instance, static, and
  interface selectors;
- control flow, exception handling, internal-table operations, string
  processing, pragmas, system fields, text symbols, literals, operators, and
  built-in types and functions;
- Open SQL statements, joins, clauses, aggregate functions, host variables,
  and parenthesized select lists;
- string templates with embedded ABAP expressions, escapes, and formatting
  options; and
- named units and nested control-flow blocks for folding and Sticky Scroll.

Contextual scopes prevent keyword fragments in names such as `sy-subrc`,
`lo_object->method`, and `zif_interface~method` from receiving misleading
keyword colors.

### AMDP and HANA SQLScript

Methods declared with `BY DATABASE PROCEDURE FOR HDB` embed a dedicated HANA
SQLScript grammar until `ENDMETHOD`. The embedded grammar highlights:

- SQL queries, joins, clauses, set operations, window functions, partitions,
  and aggregate functions;
- table variables, `:` host variables, assignments, declarations, cursors,
  conditions, handlers, and procedural control flow;
- HANA built-in functions, SQLScript types, session context, exception and
  diagnostic variables, comments, strings, numbers, and operators; and
- `SIGNAL`, `RESIGNAL`, and related error-handling constructs.

The surrounding AMDP method header and closing `ENDMETHOD` retain their ABAP
scopes.

### ABAP CDS

Files ending in `.ddls` are registered as ABAP CDS. The CDS grammar recognizes:

- view entity declarations, parameters, select lists, keys, aliases, data
  sources, joins, associations, cardinalities, filters, grouping, and having
  clauses;
- annotations, annotation objects and arrays, enum values, built-in `abap.*`
  types, typed literals, strings, numbers, and comments;
- `$parameters`, `$projection`, and `$session` variables, qualified element
  names, named function arguments, operators, and SQL expressions; and
- casts, case expressions, aggregate and scalar functions, currency and unit
  conversion, and date calculations.

CDS has its own `//` and block-comment behavior, braces, brackets, parentheses,
and quote-pair configuration.

## Editor Features

- Keyword-prefixed ABAP 7.50 snippets for reports, declarations, object-oriented
  code, constructor expressions, control flow, internal tables, Open SQL, and
  ABAP Unit assertions.
- ABAP CDS snippets for classic views, parameters, associations, annotations,
  projected elements, expressions, filtering, and grouping.
- Whole-file templates for executable reports, global classes, ABAP Unit test
  classes, and classic ABAP CDS views through **Snippets: Fill File with
  Snippet**.
- Automatic bracket, quote, and comment handling for ABAP and CDS.
- Folding markers for classes, interfaces, methods, forms, function modules,
  modules, selection-screen blocks, and common control-flow blocks.
- Sticky Scroll fallback based on folding ranges when no document-symbol
  provider is active.
- Theme-compatible TextMate scopes tested against a running VS Code Extension
  Host.

## Scope

The grammars are lexical. They do not parse complete programs, resolve names,
read a workspace, or connect to an SAP system. This package contains no
extension runtime, scanner, external executable, network access, or background
analysis.

Install the separate **ABAP LSP** extension when diagnostics, navigation,
semantic tokens, context-aware completion, parser-backed document symbols, or
workspace and SAP repository integration are required.

## Development

Install the locked development dependencies and run the VS Code-host tests:

```sh
npm ci
npm test
npm run verify:package
```

When this directory is opened as the VS Code workspace, the Run and Debug view
provides two developer workflows:

- **Run ABAP Language Basics** opens the ABAP fixtures in an Extension
  Development Host for interactive checks. It uses project-local, ignored
  profile and extension directories so an installed extension cannot override
  the development grammar while VS Code's built-in themes remain available.
- **Run Extension Tests** compiles and runs the automated test suite inside an
  isolated Extension Development Host.

The matching default build and test tasks are available through **Tasks: Run
Build Task** and **Tasks: Run Test Task**. A separate **verify extension
package** task builds and validates the VSIX contents.

The TextMate grammars are loaded directly from `syntaxes/`; there is no grammar
build step. Stop a running Development Host before starting it again because VS
Code loads declarative grammar contributions when that host starts.

`verify:package` builds the platform-neutral VSIX and checks that it contains
only the declarative runtime assets and Marketplace documentation. See
`RELEASING.md` for the tag-driven release setup.
