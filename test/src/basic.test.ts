import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const basicExtensionId = "1meracle1.abap-language-basics";

suite("ABAP language basics", () => {
  test("owns the ABAP language and loads in the extension host", async () => {
    const extension = vscode.extensions.getExtension(basicExtensionId);
    assert.ok(extension, `${basicExtensionId} is not available in the test host`);
    assert.strictEqual(
      path.resolve(extension.extensionPath),
      path.resolve(__dirname, ".."),
      "the test host loaded ABAP Language Basics from a different checkout",
    );

    const document = await openFixture("highlighting.abap");
    assert.strictEqual(document.languageId, "abap");
  });

  test("uses TextMate-compatible regular-expression options", () => {
    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    assert.doesNotMatch(
      JSON.stringify(grammar),
      /\(\?[imx-]*s[imx-]*:/,
      "VS Code's Oniguruma does not support the inline s option",
    );
    assert.doesNotMatch(
      JSON.stringify(grammar),
      /"keyword\.control(?:\.|\")/,
      "ABAP keywords must not inherit themes' contrasting control-flow color",
    );
  });

  test("tokenizes INCLUDE in the running development extension", async () => {
    const document = await openFixture("highlighting.abap");
    const tokens = await vscode.commands.executeCommand<Array<{
      c: string;
      t: string;
      r: Record<string, string | undefined>;
    }>>("_workbench.captureSyntaxTokens", document.uri);
    const includeToken = tokens.find(token => token.c === "INCLUDE");

    assert.ok(includeToken, "VS Code did not emit an INCLUDE syntax token");
    assert.match(includeToken.t, /\bkeyword\.other\.control\.include\.abap\b/);
    assert.ok(
      includeToken.r.dark_plus,
      `Dark+ did not assign INCLUDE a foreground: ${JSON.stringify(includeToken)}`,
    );
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
      "keyword.operator.expression.constructor.abap",
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

  test("matches highlighted fixture constructs with their owning scopes", () => {
    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));

    const classBlock = grammar.repository.blocks.patterns.find(
      (pattern: { name: string }) => pattern.name === "meta.class.abap",
    );
    const moduleBlock = grammar.repository.blocks.patterns.find(
      (pattern: { name: string }) =>
        pattern.name === "meta.function.module.abap",
    );
    assert.ok(classBlock);
    assert.ok(moduleBlock);
    assert.strictEqual(
      classBlock.beginCaptures[3].name,
      "storage.modifier.class.abap",
    );
    assert.strictEqual(
      moduleBlock.beginCaptures[3].name,
      "storage.modifier.module.abap",
    );
    for (const [line, modifier] of [
      ["CLASS lcl_example DEFINITION.", "DEFINITION"],
      ["CLASS lcl_example IMPLEMENTATION.", "IMPLEMENTATION"],
    ]) {
      assert.strictEqual(
        textMateRegex(classBlock.begin).exec(line)?.[3],
        modifier,
      );
    }
    assert.strictEqual(
      textMateRegex(moduleBlock.begin).exec("MODULE status_0100 OUTPUT.")?.[3],
      "OUTPUT",
    );

    const declarations = grammar.repository.declarations.patterns;
    const inlineData = declarations.find((pattern: { match: string }) =>
      pattern.match.includes("DATA|FINAL"));
    const memberDeclaration = declarations.find((pattern: { match: string }) =>
      pattern.match.includes("CLASS-EVENTS|EVENTS"));
    assert.ok(inlineData);
    assert.ok(memberDeclaration);
    assert.ok(textMateRegex(inlineData.match).test("@DATA(lt_rows)"));
    assert.ok(textMateRegex(memberDeclaration.match).test(
      "CLASS-EVENTS shutdown",
    ));

    const declarationTypes = grammar.repository["declaration-types"].patterns;
    const includeType = declarationTypes.find((pattern: { match: string }) =>
      textMateRegex(pattern.match).test("INCLUDE TYPE ty_report_state"));
    const typeReference = declarationTypes.find((pattern: { match: string }) =>
      textMateRegex(pattern.match).test("TYPE REF TO ty_report_state"));
    assert.ok(includeType);
    assert.ok(typeReference);
    assert.strictEqual(
      textMateRegex(includeType.match).exec("INCLUDE TYPE ty_report_state")?.[1],
      "INCLUDE",
    );
    assert.strictEqual(
      includeType.captures[1].name,
      "keyword.other.control.include.abap",
    );
    assert.strictEqual(
      textMateRegex(typeReference.match).exec("TYPE REF TO ty_report_state")
        ?.[2].trim(),
      "REF TO",
    );
    assert.strictEqual(typeReference.captures[2].name, "storage.type.abap");
    assert.doesNotMatch(
      "TYPE REF TO data",
      textMateRegex(typeReference.match),
      "REF must fall through to the storage-type keyword scope",
    );

    const constructor = textMateRegex(
      grammar.repository.constructors.patterns[0].match,
    );
    for (const syntax of [
      "VALUE ty_numbers(",
      "FILTER #(",
      "CORRESPONDING ty_target(",
      "REDUCE i(",
      "REF #(",
    ]) {
      assert.ok(constructor.test(syntax), `constructor did not match ${syntax}`);
    }

    const otherKeyword = grammar.repository.keywords.patterns.find(
      (pattern: { name: string }) => pattern.name === "keyword.other.abap",
    );
    const supportFunction = grammar.repository.keywords.patterns.find(
      (pattern: { name: string }) => pattern.name === "support.function.abap",
    );
    const compositeKeyword = grammar.repository["composite-keywords"].patterns[0];
    assert.ok(otherKeyword);
    assert.ok(supportFunction);
    assert.doesNotMatch(
      "DATA lv_text TYPE string VALUE 'text'.",
      textMateRegex(supportFunction.match),
    );
    assert.doesNotMatch(
      "CONSTANTS lc_number TYPE i VALUE 42.",
      textMateRegex(supportFunction.match),
    );
    assert.match("VALUE #(", textMateRegex(supportFunction.match));
    assert.match("VALUE", textMateRegex(otherKeyword.match));
    for (const keyword of [
      "DEFINITION", "FIELD", "IMPLEMENTATION", "INPUT", "INSTANCES",
      "IS", "OUTPUT", "SCREEN", "TIMES",
    ]) {
      assert.ok(
        textMateRegex(otherKeyword.match).test(keyword),
        `keyword pattern did not match ${keyword}`,
      );
    }
    assert.ok(textMateRegex(compositeKeyword.match).test(
      "AT SELECTION-SCREEN OUTPUT.",
    ));
    assert.doesNotMatch("ls_row-field", textMateRegex(otherKeyword.match));

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/highlighting.abap"),
      "utf8",
    );
    for (const syntax of [
      "AT SELECTION-SCREEN OUTPUT.",
      "SELECTION-SCREEN COMMENT 1(20) text-c01 FOR FIELD p_check.",
      "LOOP AT SCREEN.",
      "MODULE status_0100 OUTPUT.",
      "CLASS lcl_example DEFINITION.",
      "CLASS lcl_example IMPLEMENTATION.",
      "SET HANDLER me->on_finished FOR ALL INSTANCES.",
      "SORT lt_copy DESCENDING.",
      "DO 2 TIMES.",
      "SELECT carrid FROM scarr INTO @DATA(lv_carrid).",
      "GROUP BY carrier~carrid",
      "ORDER BY carrier~carrid ASCENDING",
      "INTO TABLE @DATA(lt_connection_counts).",
      "DATA(lt_numbers) = VALUE ty_numbers( ( 1 ) ( 2 ) ).",
      "DATA(lt_filtered) = FILTER #( lt_more WHERE table_line > 1 ).",
      "DATA(ls_target) = CORRESPONDING ty_target(",
      "DATA(lv_total) = REDUCE i(",
      "DATA(lv_text) = CONV string( lv_total ).",
      "DATA(lv_exact) = EXACT i( lv_text ).",
      "DATA(lv_result) = COND string(",
      "WHEN normalized IS INITIAL THEN `empty`",
      "rv_output = SWITCH string(",
      "DATA(lr_output) = REF #( rv_output ).",
      "DATA(lo_type) = CAST cl_abap_elemdescr(",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
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
        pattern.name === "punctuation.definition.variable.host.abap",
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
      "keyword.other.control.handler.abap"));

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
      "meta.statement.open-sql.delete.abap",
    ]) {
      assert.ok(statements.some((pattern: { name: string }) =>
        pattern.name === scope));
    }
    assert.strictEqual(
      grammar.repository["modify-statements"].patterns[0].name,
      "meta.statement.modify.abap",
    );
    assert.match(
      JSON.stringify(statements),
      /variable\.other\.dynamic-table\.sql\.abap/,
    );

    const sqlTokens = grammar.repository["open-sql-tokens"].patterns;
    const tokenText = JSON.stringify(sqlTokens);
    for (const clause of [
      "APPENDING", "BUFFER", "BY", "BYPASSING", "ENTRIES", "FIELDS", "GROUP",
      "HAVING", "JOIN", "OF", "PACKAGE", "TABLE", "UNION", "VALUES",
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
      "keyword.other.logical.sql.abap",
      "keyword.other.control.conditional.sql.abap",
    ]) {
      assert.match(tokenText, new RegExp(scope.replaceAll(".", "\\.")));
    }

    const hostVariable = sqlTokens.find((pattern: {
      captures?: Record<string, { name: string }>;
    }) => pattern.captures?.["2"]?.name ===
      "variable.other.host-variable.sql.abap");
    assert.ok(hostVariable);
    assert.strictEqual(
      hostVariable.captures["1"].name,
      "punctuation.definition.variable.host.abap",
    );
    assert.match("@space", textMateRegex(hostVariable.match));
    assert.doesNotMatch("@DATA(lv_carrid)", textMateRegex(hostVariable.match));

    const inlineData = grammar.repository.declarations.patterns.find(
      (pattern: { match?: string }) => pattern.match?.includes("DATA|FINAL"),
    );
    const sqlKeyword = sqlTokens.find((pattern: { name?: string }) =>
      pattern.name === "keyword.other.sql.abap");
    assert.ok(inlineData);
    assert.ok(sqlKeyword);
    assert.match("DATA(lv_carrid)", textMateRegex(inlineData.match));
    assert.match("BUFFER", textMateRegex(sqlKeyword.match));
    assert.match("BY", textMateRegex(sqlKeyword.match));
    assert.match("OF", textMateRegex(sqlKeyword.match));
    assert.match("TABLE", textMateRegex(sqlKeyword.match));

    const tableSource = sqlTokens.find((pattern: { match?: string }) =>
      pattern.match?.includes("FROM|JOIN|UPDATE|MODIFY"));
    assert.ok(tableSource);
    assert.doesNotMatch("FROM TABLE", textMateRegex(tableSource.match));
    assert.match("FROM scarr", textMateRegex(tableSource.match));

    const tokens = await vscode.commands.executeCommand<Array<{
      c: string;
      t: string;
      r: Record<string, string | undefined>;
    }>>("_workbench.captureSyntaxTokens", document.uri);
    for (const keyword of ["AND", "IN", "LIKE"]) {
      const token = tokens.find(candidate => candidate.c === keyword);
      assert.ok(token, `VS Code did not emit an ${keyword} syntax token`);
      assert.match(token.t, /\bkeyword\.other\.logical\.sql\.abap\b/);
      assert.ok(
        token.r.dark_plus,
        `Dark+ did not assign ${keyword} a foreground: ${JSON.stringify(token)}`,
      );
    }
    for (const keyword of ["UP", "TO"]) {
      const token = tokens.find(candidate => candidate.c === keyword);
      assert.ok(token, `VS Code did not emit an ${keyword} syntax token`);
      assert.match(token.t, /\bkeyword\.other\.sql\.abap\b/);
      assert.ok(
        token.r.dark_plus,
        `Dark+ did not assign ${keyword} a foreground: ${JSON.stringify(token)}`,
      );
    }
    for (const keyword of ["OF", "TABLE"]) {
      const token = tokens.find(candidate =>
        candidate.c === keyword &&
        /\bkeyword\.other\.sql\.abap\b/.test(candidate.t));
      assert.ok(token, `VS Code did not emit an SQL ${keyword} syntax token`);
      assert.ok(
        token.r.dark_plus,
        `Dark+ did not assign ${keyword} a foreground: ${JSON.stringify(token)}`,
      );
    }

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/open-sql.abap"),
      "utf8",
    );
    for (const syntax of [
      "SELECT SINGLE", "LEFT OUTER JOIN", "FOR ALL ENTRIES IN",
      "COALESCE(", "CASE WHEN", "UNION DISTINCT", "INSERT INTO",
      "ACCEPTING DUPLICATE KEYS", "UPDATE (lv_table)",
      "MODIFY (lv_table)", "DELETE FROM (lv_table)", "WHERE (lv_where)",
      "BYPASSING BUFFER", "UP TO 100 ROWS",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
    }
  });

  test("scopes string-template escapes, expressions, and formatting options", async () => {
    const document = await openFixture("string-templates.abap");
    await vscode.window.showTextDocument(document);
    assert.strictEqual(document.languageId, "abap");

    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));
    const template = grammar.repository.strings.patterns.find(
      (pattern: { name: string }) => pattern.name === "string.template.abap",
    );
    assert.ok(template);
    assert.strictEqual(template.end, "\\|");
    assert.strictEqual(template.applyEndPatternLast, 1);
    assert.match(template.patterns[0].match, /nrt/);

    const interpolation = template.patterns.find(
      (pattern: { name?: string }) => pattern.name === "meta.interpolation.abap",
    );
    assert.ok(interpolation);
    const interpolationIncludes = interpolation.patterns
      .map((pattern: { include?: string }) => pattern.include);
    for (const include of [
      "#comments", "#calls", "#constructors", "#strings", "#pragmas",
      "#string-template-format-options", "#declarations",
    ]) {
      assert.ok(interpolationIncludes.includes(include));
    }

    const formatOptions = grammar.repository["string-template-format-options"]
      .patterns;
    const formatText = JSON.stringify(formatOptions);
    for (const option of [
      "WIDTH", "ALIGN", "PAD", "CASE", "SIGN", "EXPONENT", "DECIMALS",
      "ZERO", "XSD", "STYLE", "CURRENCY", "NUMBER", "ALPHA", "DATE",
      "TIME", "TIMESTAMP", "TIMEZONE", "COUNTRY",
    ]) {
      assert.match(formatText, new RegExp(`\\b${option}\\b`));
    }
    for (const value of [
      "LEFTPLUS", "RIGHTSPACE", "SIGN_AS_POSTFIX", "SCIENTIFIC",
      "SCALE_PRESERVING_SCIENTIFIC", "ENGINEERING", "ENVIRONMENT",
    ]) {
      assert.match(formatText, new RegExp(`\\b${value}\\b`));
    }

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/string-templates.abap"),
      "utf8",
    );
    for (const syntax of [
      "\\\\|", "\\|", "\\{", "\\}", "\\n", "\\r", "\\t",
      "ALIGN = RIGHT", "STYLE = SCIENTIFIC", "TIMESTAMP = ISO",
      "ALIGN = (lv_alignment)", "|Nested { lv_text }|",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
    }
  });

  test("scopes internal-table statements, additions, and ABAP literals", async () => {
    const document = await openFixture("internal-tables.abap");
    await vscode.window.showTextDocument(document);
    assert.strictEqual(document.languageId, "abap");

    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));
    const statements = grammar.repository["internal-table-statements"].patterns;
    for (const scope of [
      "meta.statement.internal-table.read.abap",
      "meta.statement.internal-table.append.abap",
      "meta.statement.internal-table.insert.abap",
      "meta.statement.internal-table.delete.abap",
      "meta.statement.internal-table.delete-duplicates.abap",
      "meta.statement.internal-table.sort.abap",
      "meta.statement.internal-table.collect.abap",
      "meta.statement.internal-table.describe.abap",
    ]) {
      assert.ok(statements.some((pattern: { name: string }) =>
        pattern.name === scope));
    }
    assert.strictEqual(
      grammar.repository["modify-statements"].patterns[0].name,
      "meta.statement.modify.abap",
    );

    const tokenText = JSON.stringify(
      grammar.repository["internal-table-tokens"].patterns,
    );
    assert.ok(grammar.repository["internal-table-tokens"].patterns.some(
      (pattern: { include?: string }) => pattern.include === "#constructors",
    ));
    for (const syntax of [
      "TRANSPORTING", "NO", "FIELDS", "BINARY", "SEARCH", "REFERENCE",
      "LINES", "OF", "INITIAL", "LINE", "ADJACENT", "DUPLICATES",
      "ASCENDING", "COMPARING", "COMPONENTS", "DESCENDING", "INDEX",
      "USING", "WITH",
    ]) {
      assert.match(tokenText, new RegExp(`\\b${syntax}\\b`));
    }

    const loop = grammar.repository.blocks.patterns.find(
      (pattern: { name: string }) => pattern.name === "meta.block.loop.abap",
    );
    assert.ok(loop);
    assert.ok(loop.patterns.some((pattern: { name?: string }) =>
      pattern.name === "meta.statement.internal-table.loop.abap"));

    const number = grammar.repository.numbers.patterns[0];
    assert.strictEqual(number.name, "constant.numeric.abap");
    assert.doesNotMatch(number.match, /\\\\\./);

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/internal-tables.abap"),
      "utf8",
    );
    for (const syntax of [
      "TRANSPORTING NO FIELDS", "BINARY SEARCH", "REFERENCE INTO",
      "WITH TABLE KEY", "WITH KEY", "APPEND INITIAL LINE",
      "INSERT LINES OF", "INSERT VALUE ty_row(", "USING KEY",
      "ADJACENT DUPLICATES FROM", "COMPARING id text", "DESCRIBE TABLE",
      "SORT lt_rows", "COLLECT VALUE ty_row(",
      "'Don''t'", "`Use `` inside`", "9999999999999999999999999999999",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
    }
  });

  test("scopes table expressions, dereferencing, and selector members", async () => {
    const document = await openFixture("expressions.abap");
    await vscode.window.showTextDocument(document);
    assert.strictEqual(document.languageId, "abap");

    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));
    const tableExpressions = grammar.repository["table-expressions"].patterns;
    assert.ok(tableExpressions.some((pattern: { name: string }) =>
      pattern.name === "meta.table-expression.abap"));
    assert.ok(tableExpressions.some((pattern: { name: string }) =>
      pattern.name === "meta.table-expression.chained.abap"));

    const tableContent = JSON.stringify(
      grammar.repository["table-expression-content"].patterns,
    );
    for (const scope of [
      "entity.name.key.table.abap",
      "variable.other.dynamic-key.abap",
      "variable.other.member.key.abap",
      "variable.other.dynamic-component.abap",
      "keyword.other.table-expression.abap",
    ]) {
      assert.match(tableContent, new RegExp(scope.replaceAll(".", "\\.")));
    }

    const identifiers = JSON.stringify(grammar.repository.identifiers.patterns);
    for (const scope of [
      "variable.language.self.abap",
      "entity.name.type.class.reference.abap",
      "variable.other.object.abap",
      "variable.language.dereferenced.abap",
      "variable.other.member.static.abap",
      "variable.other.member.object.abap",
      "variable.other.member.abap",
    ]) {
      assert.match(identifiers, new RegExp(scope.replaceAll(".", "\\.")));
    }
    assert.doesNotMatch(
      grammar.repository.identifiers.patterns.at(-1).match,
      /\(\?:\[-~\]/,
    );
    assert.match(grammar.repository.operators.patterns[0].match, /\\]/);

    const globalKeywords = grammar.repository.keywords.patterns
      .map((pattern: { match: string }) => pattern.match)
      .join("\n");
    assert.match(globalKeywords, /\(\?<!\[!\\-~>\/\]\)/);
    assert.match(globalKeywords, /\(\?!\[-~\/\]\)/);

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/expressions.abap"),
      "utf8",
    );
    for (const syntax of [
      "[ KEY by_id COMPONENTS", "[ KEY (lv_key) COMPONENTS",
      "(lv_component) =", "[ KEY by_text INDEX 1 ]", "]-rows[",
      "lr_row->*-id", "me->handler", "cl_abap_typedescr=>describe_by_data",
      "zif_worker~preferred", "ls_keywords-select",
    ]) {
      assert.ok(fixture.includes(syntax), `fixture is missing ${syntax}`);
    }
  });

  test("scopes character and byte string processing statements", async () => {
    const document = await openFixture("string-processing.abap");
    await vscode.window.showTextDocument(document);
    assert.strictEqual(document.languageId, "abap");

    const grammar = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../syntaxes/abap.tmLanguage.json"),
      "utf8",
    ));
    const statement = grammar.repository["string-processing-statements"]
      .patterns[0];
    assert.strictEqual(statement.name, "meta.statement.string-processing.abap");
    for (const keyword of [
      "FIND", "REPLACE", "CONCATENATE", "SPLIT", "SHIFT", "TRANSLATE",
      "CONDENSE",
    ]) {
      assert.match(statement.begin, new RegExp(`\\b${keyword}\\b`));
    }

    const tokenText = JSON.stringify(statement.patterns);
    for (const addition of [
      "OCCURRENCES", "REGEX", "IGNORING", "MATCH", "REPLACEMENT",
      "RESULTS", "SECTION", "OFFSET", "SUBMATCHES", "SEPARATED",
      "RESPECTING", "BLANKS", "RIGHT", "CIRCULAR", "LEFT", "DELETING",
      "LEADING", "NO-GAPS",
    ]) {
      assert.match(tokenText, new RegExp(`\\b${addition}\\b`));
    }
    assert.match(tokenText, /keyword\.other\.string-processing\.abap/);

    const tokens = await vscode.commands.executeCommand<Array<{
      c: string;
      t: string;
      r: Record<string, string | undefined>;
    }>>("_workbench.captureSyntaxTokens", document.uri);
    for (const keyword of ["BLANKS", "RIGHT", "LEFT"]) {
      const token = tokens.find(candidate => candidate.c === keyword);
      assert.ok(token, `VS Code did not emit a ${keyword} syntax token`);
      assert.match(
        token.t,
        /\bkeyword\.other\.string-processing\.abap\b/,
      );
      assert.ok(
        token.r.dark_plus,
        `Dark+ did not assign ${keyword} a foreground: ${JSON.stringify(token)}`,
      );
    }

    const fixture = fs.readFileSync(
      path.resolve(__dirname, "../test/fixtures/string-processing.abap"),
      "utf8",
    );
    for (const syntax of [
      "FIND ALL OCCURRENCES OF REGEX", "IGNORING CASE", "MATCH COUNT",
      "REPLACE SECTION OFFSET", "REPLACEMENT COUNT", "SPLIT lv_text",
      "INTO TABLE", "CONCATENATE LINES OF", "SEPARATED BY",
      "RESPECTING BLANKS", "RIGHT CIRCULAR", "DELETING LEADING",
      "TO UPPER CASE", "CONDENSE lv_text NO-GAPS",
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

function textMateRegex(source: string): RegExp {
  return new RegExp(source.replaceAll("(?i:", "(?:"), "i");
}
