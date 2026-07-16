import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(__dirname, "..");
  const cachePath = path.join(repositoryRoot, ".vscode-test");

  await runTests({
    extensionDevelopmentPath: repositoryRoot,
    extensionTestsPath: path.resolve(__dirname, "index"),
    cachePath,
    launchArgs: [
      path.resolve(repositoryRoot, "test/fixtures"),
      `--user-data-dir=${path.join(cachePath, "user-data")}`,
      `--extensions-dir=${path.join(cachePath, "extensions")}`,
    ],
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
