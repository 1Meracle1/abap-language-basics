import * as assert from "assert";
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

    assert.ok(starts.has(25), "expected INTERFACE folding range");
    assert.ok(starts.has(29), "expected FORM folding range");
    assert.ok(starts.has(30), "expected CASE folding range");
    assert.ok(starts.has(36), "expected FUNCTION folding range");
    assert.ok(starts.has(37), "expected TRY folding range");
    assert.ok(starts.has(38), "expected DO folding range");
    assert.ok(starts.has(44), "expected MODULE folding range");
    assert.ok(starts.has(45), "expected WHILE folding range");
    assert.ok(starts.has(49), "expected CLASS definition folding range");
    assert.ok(starts.has(54), "expected SELECT folding range");
    assert.ok(starts.has(57), "expected CLASS implementation folding range");
    assert.ok(starts.has(58), "expected METHOD folding range");
    assert.ok(starts.has(59), "expected IF folding range");
    assert.ok(starts.has(60), "expected LOOP folding range");
  });
});

function openFixture(name: string): Thenable<vscode.TextDocument> {
  return vscode.workspace.openTextDocument(vscode.Uri.file(
    path.resolve(__dirname, "../test/fixtures", name),
  ));
}
