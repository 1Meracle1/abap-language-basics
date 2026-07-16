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
