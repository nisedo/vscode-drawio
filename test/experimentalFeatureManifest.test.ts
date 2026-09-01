import assert = require("node:assert/strict");
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	experimentalFeaturesContextKey,
	experimentalFeaturesSettingId,
} from "../src/extensionIds";

interface ExtensionManifest {
	contributes: {
		commands: { command: string; enablement?: string }[];
		configuration: { properties: Record<string, unknown> }[];
	};
}

const manifest = JSON.parse(
	readFileSync(join(__dirname, "../package.json"), "utf-8")
) as ExtensionManifest;

describe("experimental text editor manifest", () => {
	it("contributes the setting that controls the feature", () => {
		const properties = Object.assign(
			{},
			...manifest.contributes.configuration.map(
				(entry) => entry.properties
			)
		);

		assert.ok(properties[experimentalFeaturesSettingId]);
	});

	it("uses the runtime context key for command enablement", () => {
		const command = manifest.contributes.commands.find(
			(entry) =>
				entry.command === "hediet.vscode-drawio.editDiagramAsText"
		);

		assert.equal(command?.enablement, experimentalFeaturesContextKey);
	});
});
