import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tag = process.argv[2];
assert.ok(tag, "usage: node scripts/check-version.mjs <tag>");

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
const expected = `v${manifest.version}`;
assert.equal(tag, expected, `release tag ${tag} must equal ${expected}`);

console.log(`Release tag ${tag} matches package version ${manifest.version}.`);
