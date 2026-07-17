import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

interface Snippet {
  prefix: string | string[];
  body: string | string[];
  description: string;
}

suite("ABAP snippets", () => {
  const snippets = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, "../snippets/abap.json"),
    "utf8",
  )) as Record<string, Snippet>;

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

function bodyOf(snippets: Record<string, Snippet>, name: string): string {
  const snippet = snippets[name];
  assert.ok(snippet, `missing snippet: ${name}`);
  return Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
