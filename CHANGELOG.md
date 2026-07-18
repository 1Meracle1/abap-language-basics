# Changelog

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
