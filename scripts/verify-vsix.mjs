import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access } from "node:fs/promises";

const vsixPath = process.argv[2];
assert.ok(vsixPath, "usage: node scripts/verify-vsix.mjs <path-to-vsix>");
await access(vsixPath);

const expected = [
  "[content_types].xml",
  "extension.vsixmanifest",
  "extension/changelog.md",
  "extension/cds-language-configuration.json",
  "extension/language-configuration.json",
  "extension/license.txt",
  "extension/package.json",
  "extension/readme.md",
  "extension/snippets/abap.json",
  "extension/syntaxes/abap-cds.tmlanguage.json",
  "extension/syntaxes/abap.tmlanguage.json",
].sort();

const actual = execFileSync("unzip", ["-Z1", vsixPath], { encoding: "utf8" })
  .split("\n")
  .map(entry => entry.trim().toLowerCase())
  .filter(entry => entry && !entry.endsWith("/"))
  .sort();

assert.deepEqual(actual, expected, `unexpected VSIX contents:\n${actual.join("\n")}`);
console.log(`Verified ${vsixPath}: ${actual.length} expected files.`);
