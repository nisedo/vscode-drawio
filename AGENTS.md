# Repository guide

## Branches and remotes

-   Use `main` only to track `upstream/main` from `hediet/vscode-drawio`.
-   Make personal changes on `nisedo-dev`. It tracks `origin/nisedo-dev`.
-   Update `main` with a fast-forward pull. Then merge `main` into `nisedo-dev` and resolve the fork changes there.
-   Keep the `drawio` submodule at its recorded commit. Change the submodule pointer only as an explicit Draw.io upgrade.
-   Preserve user changes. Ask before deleting branches, rewriting history, force-pushing, or changing the pinned submodule.

## Architecture

-   `src/` runs in the VS Code extension host.
-   `src/DrawioClient/` is the message seam between the extension host and the Draw.io webview.
-   `drawio-custom-plugins/src/` runs inside the Draw.io webview.
-   `drawio/` is the upstream Draw.io Git submodule.
-   `dist/` and `node_modules/` are generated. Edit their source files instead.
-   `package.json` defines editor contributions, settings, build commands, and VSIX contents.

## Change workflow

1. Confirm the current branch, worktree status, and submodule status.
2. Install the locked dependencies with `yarn install --frozen-lockfile` when needed.
3. Keep changes small. Preserve the extension-host and webview seam.
4. Format only the files that the task changes.
5. Run the relevant checks before reporting completion.

## Lifecycle and performance rules

-   Give each listener, timer, MobX autorun, output channel, status item, and webview subscription a clear owner.
-   Dispose editor-owned resources when its webview closes. Dispose extension-owned resources when the extension deactivates.
-   Clear pending timers and reject pending message requests during disposal.
-   Treat mouse movement, model changes, autosave, configuration changes, and webview messages as hot paths.
-   Throttle high-frequency cross-webview messages. Coalesce repeated work into one pending operation.
-   Update affected cells only. Avoid a complete diagram scan for each model change.
-   Use keyed maps for participant cursors, selections, and overlays when updates look up items by ID.
-   Serialize async document writes. A later edit must not be overwritten by an earlier operation that finishes late.
-   Keep production bridge logging disabled or bounded. Enable detailed logs only for diagnosis.

## Verification

-   Run `yarn build-extension` after extension-host changes.
-   Run `yarn build-plugins` after webview-plugin changes.
-   Run `yarn build` when a new VSIX is required.
-   Run `yarn typecheck` after TypeScript changes. It checks both the extension host and webview plugins.
-   Run Prettier in check mode on changed files. Do not reformat unrelated inherited files.
-   This repository has no automated test suite. Manually open a `.drawio` file in an Extension Development Host for runtime changes. Test save, reopen, export, and the changed command or plugin behavior.
-   A successful package build is not runtime proof. Report build checks and manual checks separately.
