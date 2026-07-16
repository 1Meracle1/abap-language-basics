# Releasing

Releases are driven by version tags. Set the exact SemVer version in
`package.json` and `package-lock.json`, merge the tested change to `main`, then
create and push the matching `vX.Y.Z` tag. The workflow rejects a tag that does
not equal `v${package.json.version}`.

Before the first release:

1. Create and claim the `1meracle1` namespace on Open VSX.
2. Add its publishing token as `OVSX_PAT` in the protected GitHub `release`
   environment.
3. Create the Azure service connection
   `abap-language-basics-marketplace` using Microsoft Entra workload identity
   federation.
4. Add that managed identity to the `1meracle1` Visual Studio Marketplace
   publisher with the Contributor role.
5. Connect the repository to Azure Pipelines using `azure-pipelines.yml`.

The GitHub workflow tests and packages the extension once, creates the GitHub
Release, and publishes the same VSIX to Open VSX. Azure Pipelines repeats the
version and package validation before publishing to Visual Studio Marketplace
with `vsce --azure-credential`.

Run the complete local validation with:

```sh
npm ci
npm test
npm run verify:package
```
