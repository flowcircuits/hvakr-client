# Publishing a New Version to NPM

<!-- AI: When the user asks to bump the version, release to NPM, or publish a new version, follow these steps. -->

1. Bump the version number in `package.json`
2. Commit to `master` with a message like: `v0.1.15 - Bump version and describe changes`
3. Push to `origin/master`
4. Go to https://github.com/flowcircuits/hvakr-client/releases and draft a new release:
   - Tag: Create a new tag matching the version number (e.g. `0.1.15`)
   - Title: The version number (e.g. `0.1.15`)
   - Description: Brief summary of changes in this version
5. Publish the release and wait ~5 minutes for the GitHub Actions build to publish to NPM
