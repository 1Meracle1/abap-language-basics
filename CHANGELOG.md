# Changelog

## 0.0.6

- Added contextual highlighting for function module parameter sections,
  including the `TABLES` addition of `CALL FUNCTION`.
- Added highlighting and snippets for table comprehensions with `FOR ... IN`
  and optional `WHERE` conditions.
- Added highlighting and snippets for `LOOP AT GROUP` member loops and related
  internal-table grouping additions.

## 0.0.5

- Improved contextual highlighting for `TABLES` declarations, comparison
  operators, range components, and additions of `ASSIGN`, `CREATE`, `FORMAT`,
  `MESSAGE`, and `SUBMIT` statements.
- Added whole-file templates for executable reports, global classes, ABAP Unit
  test classes, and classic ABAP CDS views.
- Added ABAP CDS completions for parameterized views, annotations,
  associations, projected elements, expressions, filters, and grouping.
- Expanded ABAP snippets for report events and selections, modern method calls,
  event-handler registration, grouped loops, safe table expressions, and ABAP
  Unit assertions.
- Improved multiline constructor formatting.

## 0.0.4

- Added ABAP CDS syntax highlighting and editor configuration for `.ddls`
  files.
- Added embedded HANA SQLScript highlighting inside AMDP methods, including
  queries, procedural statements, declarations, handlers, host variables,
  built-in functions, types, comments, strings, and operators.

## 0.0.3

- Added highlighting for built-in functions and generic, instance, static, and
  interface procedure calls.
- Expanded intrinsic type highlighting for ABAP 7.50.
- Improved Open SQL `SELECT` block detection for parenthesized select lists and
  same-line table targets.

## 0.0.2

- Expanded ABAP 7.50 highlighting for declarations, object-oriented syntax,
  Open SQL, string templates and processing, internal tables, table
  expressions, operators, literals, and core statements.
- Added contextual TextMate scopes to avoid highlighting keywords inside
  identifiers and selectors.
- Added comprehensive fixture coverage and Extension Host tokenization tests.
- Added project-local VS Code launch and task configurations for interactive
  grammar development and validation.

## 0.0.1

- Initial declarative ABAP language support.
- Theme-compatible TextMate grammar with composite-keyword handling.
- ABAP 7.50 snippets and block folding markers.
