import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const basicExtensionId = "1meracle1.abap-language-basics";

suite("ABAP language basics", () => {
  test("owns the ABAP language and loads in the extension host", async () => {
    const extension = vscode.extensions.getExtension(basicExtensionId);
    assert.ok(extension, `${basicExtensionId} is not available in the test host`);

    const document = await openFixture("highlighting.abap");
    assert.strictEqual(document.languageId, "abap");
  });

  test("provides keyword-prefixed snippets", async () => {
    const document = await vscode.workspace.openTextDocument({
      language: "abap",
      content: "",
    });
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand("editor.action.insertSnippet", {
      langId: "abap",
      name: "IF block",
    });

    assert.strictEqual(document.getText(), "IF condition.\n  \nENDIF.");
  });

  test("provides named-unit and control-flow folding ranges", async () => {
    const document = await openFixture("highlighting.abap");
    const ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
      "vscode.executeFoldingRangeProvider",
      document.uri,
    );
    const starts = new Set(ranges.map(range => range.start));
    for (const linePrefix of [
      "SELECTION-SCREEN BEGIN OF BLOCK",
      "SELECTION-SCREEN BEGIN OF LINE",
      "INTERFACE lif_example",
      "INTERFACE lif_worker",
      "FORM perform_action",
      "  CASE sy-subrc",
      "FUNCTION z_example",
      "  TRY",
      "      DO 2 TIMES",
      "MODULE status_0100",
      "  WHILE sy-index",
      "CLASS lcl_example DEFINITION",
      "SELECT carrid",
      "CLASS lcl_example IMPLEMENTATION",
      "  METHOD run",
      "    IF sy-subrc",
      "      LOOP AT lt_rows",
      "CLASS lcl_worker IMPLEMENTATION",
      "  METHOD lif_worker~run",
    ]) {
      assert.ok(
        starts.has(lineOf(document, linePrefix)),
        `expected folding range for ${linePrefix}`,
      );
    }
  });

  test("declares report, OO, selection-screen, and constructor scopes", () => {
    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    const declarations = grammar.repository.declarations.patterns
      .map((pattern: { match?: string }) => pattern.match ?? "")
      .join("\n");
    assert.match(declarations, /REPORT\|PROGRAM/);
    assert.match(declarations, /SELECT-OPTIONS/);
    assert.match(declarations, /CLASS-DATA/);
    assert.match(declarations, /INTERFACES/);
    assert.match(declarations, /ALIASES/);
    assert.match(declarations, /FIELD-SYMBOL/);

    const constructor = grammar.repository.constructors.patterns[0];
    for (const operator of [
      "VALUE", "NEW", "CONV", "CAST", "EXACT", "REF",
      "CORRESPONDING", "REDUCE", "FILTER", "COND", "SWITCH",
    ]) {
      assert.match(constructor.match, new RegExp(`\\b${operator}\\b`));
    }
    assert.strictEqual(
      constructor.captures[1].name,
      "keyword.operator.constructor.abap",
    );
    assert.strictEqual(constructor.captures[2].name, "storage.type.inferred.abap");
    assert.strictEqual(constructor.captures[3].name, "entity.name.type.abap");

    const keywordPatterns = grammar.repository.keywords.patterns
      .map((pattern: { match: string }) => pattern.match)
      .join("\n");
    for (const keyword of [
      "BASE", "BLOCK", "CHECKBOX", "COMMENT", "FRAME", "LOWER",
      "MATCHCODE", "MEMORY", "MODIF", "OBLIGATORY", "POSITION",
      "PUSHBUTTON", "RADIOBUTTON", "TITLE", "ULINE",
    ]) {
      assert.match(keywordPatterns, new RegExp(`\\b${keyword}\\b`));
    }
  });

  test("covers ABAP 7.50 core statements, SQL clauses, and special tokens", () => {
    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    const keywordPatterns = grammar.repository.keywords.patterns
      .map((pattern: { match: string }) => pattern.match)
      .join("\n");
    for (const keyword of [
      "APPEND", "CLEAR", "CONCATENATE", "CREATE", "DELETE", "DESCRIBE",
      "ENDCASE", "FIND", "INSERT", "MESSAGE", "MODIFY", "READ",
      "REPLACE", "SHIFT", "SORT", "TRANSFER", "UPDATE", "WRITE",
      "DISTINCT", "FIELDS", "GROUP", "HAVING", "JOIN", "PRIMARY",
      "UNION",
    ]) {
      assert.match(keywordPatterns, new RegExp(`\\b${keyword}\\b`));
    }

    const composite = grammar.repository["composite-keywords"].patterns[0].match;
    for (const keyword of [
      "CLASS-POOL", "ENHANCEMENT-POINT", "INTERFACE-POOL",
      "PRINT-CONTROL", "SYNTAX-CHECK", "TYPE-POOL",
    ]) {
      assert.match(composite, new RegExp(keyword));
    }

    const chains = grammar.repository["chained-declarations"].patterns;
    assert.ok(chains.some((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.method.abap"));
    assert.ok(chains.some((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.event.abap"));
    assert.ok(chains.some((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.interface.abap"));
    assert.ok(chains.some((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.alias.abap"));
    for (const scope of [
      "meta.declaration.chain.type.abap",
      "meta.declaration.chain.data.abap",
      "meta.declaration.chain.field-symbol.abap",
    ]) {
      assert.ok(chains.some((pattern: { name: string }) =>
        pattern.name === scope));
    }

    const constants = grammar.repository.constants.patterns;
    assert.ok(constants.some((pattern: { name: string }) =>
      pattern.name === "variable.language.system.abap"));
    assert.ok(constants.some((pattern: { name: string }) =>
      pattern.name === "constant.other.text-symbol.abap"));
    assert.ok(constants.some((pattern: { name: string }) =>
      pattern.name === "constant.language.abap"));

    const aggregate = grammar.repository.keywords.patterns.find(
      (pattern: { name: string }) =>
        pattern.name === "support.function.aggregate.sql.abap",
    );
    assert.ok(aggregate);
    for (const functionName of ["AVG", "COUNT", "MAX", "MIN", "SUM"]) {
      assert.match(aggregate.match, new RegExp(`\\b${functionName}\\b`));
    }

    assert.ok(grammar.repository.operators.patterns.some(
      (pattern: { name: string }) =>
        pattern.name === "keyword.operator.host-variable.abap",
    ));
  });

  test("scopes structured, table, reference, and LIKE declarations", () => {
    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    const chains = grammar.repository["chained-declarations"].patterns;
    const typeChain = chains.find((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.type.abap");
    const dataChain = chains.find((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.data.abap");
    assert.ok(typeChain);
    assert.ok(dataChain);
    assert.ok(typeChain.patterns.some((pattern: { include?: string }) =>
      pattern.include === "#structured-type"));
    assert.ok(dataChain.patterns.some((pattern: { include?: string }) =>
      pattern.include === "#structured-data"));
    assert.strictEqual(
      grammar.repository["structured-type"].patterns[0].name,
      "meta.declaration.structure.type.abap",
    );
    assert.strictEqual(
      grammar.repository["structured-data"].patterns[0].name,
      "meta.declaration.structure.data.abap",
    );

    const components = grammar.repository["structured-components"].patterns;
    assert.ok(components.some((pattern: {
      captures?: Record<string, { name: string }>;
    }) => pattern.captures?.["1"]?.name ===
      "variable.other.member.declaration.abap"));

    const typeReferences = grammar.repository["declaration-types"].patterns;
    const matches = typeReferences
      .map((pattern: { match: string }) => pattern.match)
      .join("\n");
    for (const syntax of [
      "INCLUDE", "STRUCTURE", "STANDARD", "SORTED", "HASHED",
      "TABLE", "RANGE", "LINE", "REF",
    ]) {
      assert.match(matches, new RegExp(`\\b${syntax}\\b`));
    }
    for (const scope of [
      "entity.name.type.abap",
      "variable.other.reference.abap",
    ]) {
      assert.ok(typeReferences.some((pattern: {
        captures: Record<string, { name: string }>;
      }) => Object.values(pattern.captures).some(
        capture => capture.name === scope,
      )));
    }

    const keywordPatterns = grammar.repository.keywords.patterns
      .map((pattern: { match: string }) => pattern.match)
      .join("\n");
    for (const keyword of [
      "ALIAS", "BOXED", "DECIMALS", "INITIAL", "RANGE",
      "RENAMING", "SUFFIX",
    ]) {
      assert.match(keywordPatterns, new RegExp(`\\b${keyword}\\b`));
    }
  });

  test("scopes ABAP OO signatures and event handlers contextually", () => {
    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    const codeIncludes = grammar.repository.code.patterns
      .map((pattern: { include?: string }) => pattern.include);
    assert.ok(codeIncludes.indexOf("#oo-declarations") <
      codeIncludes.indexOf("#chained-declarations"));

    const declarations = grammar.repository["oo-declarations"].patterns;
    assert.ok(declarations.some((pattern: { name: string }) =>
      pattern.name === "meta.declaration.method.abap"));
    assert.ok(declarations.some((pattern: { name: string }) =>
      pattern.name === "meta.declaration.event.abap"));

    const chains = grammar.repository["chained-declarations"].patterns;
    const methodChain = chains.find((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.method.abap");
    const eventChain = chains.find((pattern: { name: string }) =>
      pattern.name === "meta.declaration.chain.event.abap");
    assert.ok(methodChain);
    assert.ok(eventChain);
    const methodHead = methodChain.patterns.find(
      (pattern: { captures?: Record<string, { name: string }> }) =>
        pattern.captures?.["1"]?.name ===
          "entity.name.function.member.abap",
    );
    assert.ok(methodHead);
    for (const guard of [
      "FOR", "EVENT", "PREFERRED", "PARAMETER", "RAISING",
      "EXCEPTIONS", "RESUMABLE",
    ]) {
      assert.match(methodHead.match, new RegExp(`\\b${guard}\\b`));
    }

    const signatures = grammar.repository["oo-signature"].patterns;
    const signatureText = JSON.stringify(signatures);
    for (const syntax of [
      "FOR", "EVENT", "OF", "PREFERRED", "PARAMETER", "DEFAULT",
      "IGNORE", "FAIL", "VALUE", "REFERENCE", "RESUMABLE",
    ]) {
      assert.match(signatureText, new RegExp(`\\b${syntax}\\b`));
    }
    for (const scope of [
      "meta.declaration.parameters.abap",
      "meta.declaration.exceptions.class.abap",
      "meta.declaration.exceptions.classic.abap",
    ]) {
      assert.ok(signatures.some((pattern: { name?: string }) =>
        pattern.name === scope));
    }
    for (const scope of [
      "entity.name.function.event.abap",
      "entity.name.type.abap",
      "variable.parameter.declaration.abap",
      "variable.parameter.reference.abap",
      "entity.name.type.class.exception.abap",
      "variable.parameter.exception.declaration.abap",
    ]) {
      assert.match(signatureText, new RegExp(scope.replaceAll(".", "\\.")));
    }

    const calls = grammar.repository.calls.patterns;
    assert.ok(calls.some((pattern: {
      captures?: Record<string, { name: string }>;
    }) => pattern.captures?.["2"]?.name ===
      "keyword.control.handler.abap"));

    const globalKeywords = grammar.repository.keywords.patterns
      .map((pattern: { match: string }) => pattern.match)
      .join("\n");
    for (const contextualKeyword of ["HANDLER", "PREFERRED", "FAIL"]) {
      assert.doesNotMatch(
        globalKeywords,
        new RegExp(`\\b${contextualKeyword}\\b`),
      );
    }

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/highlighting.abap"),
      "utf8",
    );
    for (const syntax of [
      "DEFAULT IGNORE", "PREFERRED PARAMETER", "DEFAULT FAIL",
      "FOR EVENT finished OF lif_worker", "RESUMABLE(cx_static_check)",
      "EXCEPTIONS invalid_number", "SET HANDLER",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
    }
  });

  test("scopes Open SQL statements, clauses, functions, and operands contextually", async () => {
    const document = await openFixture("open-sql.abap");
    await vscode.window.showTextDocument(document);
    assert.strictEqual(document.languageId, "abap");

    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    const codeIncludes = grammar.repository.code.patterns
      .map((pattern: { include?: string }) => pattern.include);
    assert.ok(codeIncludes.indexOf("#open-sql") <
      codeIncludes.indexOf("#keywords"));

    const statements = grammar.repository["open-sql"].patterns;
    for (const scope of [
      "meta.statement.open-sql.select.abap",
      "meta.statement.open-sql.insert.abap",
      "meta.statement.open-sql.update.abap",
      "meta.statement.open-sql.modify.abap",
      "meta.statement.open-sql.delete.abap",
    ]) {
      assert.ok(statements.some((pattern: { name: string }) =>
        pattern.name === scope));
    }

    const sqlTokens = grammar.repository["open-sql-tokens"].patterns;
    const tokenText = JSON.stringify(sqlTokens);
    for (const clause of [
      "APPENDING", "BYPASSING", "ENTRIES", "FIELDS", "GROUP",
      "HAVING", "JOIN", "PACKAGE", "UNION", "VALUES",
    ]) {
      assert.match(tokenText, new RegExp(`\\b${clause}\\b`));
    }
    for (const functionName of [
      "ABS", "CAST", "COALESCE", "CONCAT", "DIVISION", "INSTR",
      "LEFT", "LENGTH", "LPAD", "LTRIM", "REPLACE", "RIGHT",
      "ROUND", "RPAD", "RTRIM", "SUBSTRING",
    ]) {
      assert.match(tokenText, new RegExp(`\\b${functionName}\\b`));
    }
    for (const scope of [
      "entity.name.table.sql.abap",
      "entity.name.alias.sql.abap",
      "variable.other.column.sql.abap",
      "variable.other.host-variable.sql.abap",
      "variable.other.dynamic-clause.sql.abap",
      "constant.language.null.sql.abap",
      "keyword.operator.logical.sql.abap",
      "keyword.control.conditional.sql.abap",
    ]) {
      assert.match(tokenText, new RegExp(scope.replaceAll(".", "\\.")));
    }

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/open-sql.abap"),
      "utf8",
    );
    for (const syntax of [
      "SELECT SINGLE", "LEFT OUTER JOIN", "FOR ALL ENTRIES IN",
      "COALESCE(", "CASE WHEN", "UNION DISTINCT", "INSERT INTO",
      "ACCEPTING DUPLICATE KEYS", "UPDATE (lv_table)",
      "DELETE FROM", "WHERE (lv_where)",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
    }
  });
});

function openFixture(name: string): Thenable<vscode.TextDocument> {
  return vscode.workspace.openTextDocument(vscode.Uri.file(
    path.resolve(__dirname, "../test/fixtures", name),
  ));
}

function lineOf(document: vscode.TextDocument, prefix: string): number {
  for (let line = 0; line < document.lineCount; line += 1) {
    if (document.lineAt(line).text.startsWith(prefix)) {
      return line;
    }
  }
  assert.fail(`fixture line not found: ${prefix}`);
}
