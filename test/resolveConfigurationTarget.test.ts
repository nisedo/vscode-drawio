import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import { resolveConfigurationTarget } from "../src/vscode-utils/resolveConfigurationTarget";

describe("resolveConfigurationTarget", () => {
	it("preserves a workspace-folder setting", () => {
		assert.equal(
			resolveConfigurationTarget({ workspaceFolderValue: true }),
			"workspaceFolder"
		);
	});

	it("preserves a workspace setting", () => {
		assert.equal(
			resolveConfigurationTarget({ workspaceValue: true }),
			"workspace"
		);
	});

	it("uses the global target when no narrower value exists", () => {
		assert.equal(resolveConfigurationTarget(undefined), "global");
		assert.equal(resolveConfigurationTarget({}), "global");
	});

	it("prefers the narrowest configured target", () => {
		assert.equal(
			resolveConfigurationTarget({
				workspaceFolderLanguageValue: false,
				workspaceLanguageValue: false,
			}),
			"workspaceFolder"
		);
	});
});
