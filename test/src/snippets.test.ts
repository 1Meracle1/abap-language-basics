import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

interface Snippet {
  prefix: string | string[];
  body: string | string[];
  description: string;
  isFileTemplate?: boolean;
}

suite("ABAP snippets", () => {
  const snippets = loadSnippets("abap.json");

  test("defines complete snippet metadata", () => {
    assertSnippetMetadata(snippets);
  });

  test("provides report, global class, and ABAP Unit file templates", () => {
    for (const name of [
      "Executable report file",
      "Global CLASS definition and implementation",
      "Global final CLASS definition and implementation",
      "Global inherited CLASS definition and implementation",
      "Local test CLASS definition and implementation",
    ]) {
      assert.strictEqual(snippets[name]?.isFileTemplate, true, name);
    }

    assert.match(
      bodyOf(snippets, "Executable report file"),
      /^REPORT .*\n\nSTART-OF-SELECTION\./,
    );
  });

  test("covers modern calls and internal-table access", () => {
    assert.match(
      bodyOf(snippets, "Instance method call"),
      /DATA\(.*\) = .*->.*\(\n .* = .*\n\)\./,
    );
    assert.match(
      bodyOf(snippets, "Static method call"),
      /DATA\(.*\) = .*=>.*\(\n .* = .*\n\)\./,
    );
    assert.match(bodyOf(snippets, "LINE_EXISTS check"), /line_exists\(/);
    assert.match(
      bodyOf(snippets, "Optional table expression"),
      /VALUE #\( .* OPTIONAL \)/,
    );
  });

  test("covers local, global, inherited, final, and test classes", () => {
    for (const [name, syntax] of [
      ["Local CLASS definition and implementation", "DEFINITION."],
      ["Local final CLASS definition and implementation", "DEFINITION FINAL."],
      ["Local inherited CLASS definition and implementation", "INHERITING FROM"],
      [
        "Global CLASS definition and implementation",
        "DEFINITION PUBLIC CREATE PUBLIC.",
      ],
      [
        "Global final CLASS definition and implementation",
        "PUBLIC FINAL CREATE PUBLIC.",
      ],
      [
        "Global inherited CLASS definition and implementation",
        "PUBLIC INHERITING FROM",
      ],
      ["Local test CLASS definition and implementation", "FOR TESTING"],
    ]) {
      assert.match(bodyOf(snippets, name), new RegExp(escapeRegex(syntax)));
      assert.match(bodyOf(snippets, name), /CLASS .* IMPLEMENTATION\./);
    }
  });

  test("covers interface obligations and method parameter combinations", () => {
    assert.strictEqual(
      bodyOf(snippets, "INTERFACES implementation obligation"),
      "INTERFACES ${1:zif_interface}.",
    );
    assert.match(
      bodyOf(snippets, "INTERFACE method implementation"),
      /METHOD \$\{1:zif_interface\}~\$\{2:execute\}\./,
    );

    for (const [name, sections] of [
      ["METHODS importing", ["IMPORTING"]],
      ["METHODS exporting", ["EXPORTING"]],
      ["METHODS changing", ["CHANGING"]],
      ["METHODS returning", ["RETURNING"]],
      ["METHODS importing and exporting", ["IMPORTING", "EXPORTING"]],
      ["METHODS importing and changing", ["IMPORTING", "CHANGING"]],
      ["METHODS importing and returning", ["IMPORTING", "RETURNING"]],
      [
        "METHODS importing exporting changing and raising",
        ["IMPORTING", "EXPORTING", "CHANGING", "RAISING"],
      ],
    ] as Array<[string, string[]]>) {
      const body = bodyOf(snippets, name);
      for (const section of sections) {
        assert.match(body, new RegExp(`\\b${section}\\b`), `${name} lacks ${section}`);
      }
    }
  });

  test("covers TYPE and WITH table declaration additions", () => {
    for (const name of [
      "TYPE character with length",
      "TYPE packed number",
      "TYPE reference",
      "TYPE line of",
      "TYPE range of",
      "TYPE standard table of",
      "TYPE sorted table of",
      "TYPE hashed table of",
    ]) {
      assert.strictEqual(
        snippets[name]?.prefix,
        "TYPE",
        `${name} lacks TYPE prefix`,
      );
    }

    for (const name of [
      "WITH empty key",
      "WITH default key",
      "WITH non-unique primary key",
      "WITH unique primary key",
      "WITH non-unique sorted key",
      "WITH unique sorted key",
      "WITH unique hashed key",
    ]) {
      assert.strictEqual(
        snippets[name]?.prefix,
        "WITH",
        `${name} lacks WITH prefix`,
      );
    }
    assert.match(
      bodyOf(snippets, "WITH non-unique sorted key"),
      /WITH NON-UNIQUE SORTED KEY .* COMPONENTS/,
    );
  });
});

suite("ABAP CDS snippets", () => {
  const snippets = loadSnippets("abap-cds.json");

  test("defines complete snippet metadata", () => {
    assertSnippetMetadata(snippets);
  });

  test("provides classic view file templates", () => {
    for (const name of [
      "ABAP CDS view file",
      "ABAP CDS parameterized view file",
    ]) {
      const body = bodyOf(snippets, name);
      assert.strictEqual(snippets[name]?.isFileTemplate, true, name);
      assert.match(body, /@AbapCatalog\.sqlViewName/);
      assert.match(body, /define view/);
      assert.doesNotMatch(body, /define view entity/);
    }
    assert.match(
      bodyOf(snippets, "ABAP CDS parameterized view file"),
      /where .* = :\$\{4:p_key_date\}/,
    );
  });

  test("covers common view elements and expressions", () => {
    for (const name of [
      "CDS annotation",
      "CDS association",
      "CDS key element",
      "CDS element alias",
      "CDS CASE expression",
      "CDS CAST expression",
      "CDS WHERE clause",
      "CDS GROUP BY clause",
    ]) {
      assert.ok(snippets[name], `missing snippet: ${name}`);
    }
    assert.match(bodyOf(snippets, "CDS association"), /\\\$projection/);
  });

  test("is registered for the ABAP CDS language", () => {
    const manifest = JSON.parse(fs.readFileSync(
      path.resolve(__dirname, "../package.json"),
      "utf8",
    )) as {
      contributes: { snippets: Array<{ language: string; path: string }> };
    };
    assert.deepStrictEqual(
      manifest.contributes.snippets.find(entry => entry.language === "abap-cds"),
      { language: "abap-cds", path: "./snippets/abap-cds.json" },
    );
  });
});

function loadSnippets(fileName: string): Record<string, Snippet> {
  return JSON.parse(fs.readFileSync(
    path.resolve(__dirname, `../snippets/${fileName}`),
    "utf8",
  )) as Record<string, Snippet>;
}

function assertSnippetMetadata(snippets: Record<string, Snippet>): void {
  for (const [name, snippet] of Object.entries(snippets)) {
    const prefixes = Array.isArray(snippet.prefix)
      ? snippet.prefix
      : [snippet.prefix];
    const body = Array.isArray(snippet.body)
      ? snippet.body
      : [snippet.body];
    assert.ok(prefixes.length > 0 && prefixes.every(Boolean), `${name} prefix`);
    assert.ok(body.length > 0 && body.some(Boolean), `${name} body`);
    assert.ok(snippet.description, `${name} description`);
  }
}

function bodyOf(snippets: Record<string, Snippet>, name: string): string {
  const snippet = snippets[name];
  assert.ok(snippet, `missing snippet: ${name}`);
  return Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
