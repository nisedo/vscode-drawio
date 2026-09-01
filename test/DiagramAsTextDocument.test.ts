import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import { DiagramAsTextDocument } from "../src/features/DiagramAsTextDocument";

describe("DiagramAsTextDocument", () => {
	it("keeps updated and new vertices on separate lines", () => {
		const document = new DiagramAsTextDocument(
			[{ id: "vertex-1", label: "Existing" }],
			[{ label: "New" }]
		);

		assert.equal(document.toString(), "vertex-1:Existing\nNew");
	});

	it("does not parse a trailing newline as an empty vertex", () => {
		const document = DiagramAsTextDocument.parse(
			"vertex-1:Existing\nNew\n"
		);

		assert.deepEqual(document.vertexUpdates, [
			{ id: "vertex-1", label: "Existing" },
		]);
		assert.deepEqual(document.newVertices, [{ label: "New" }]);
	});

	it("removes duplicate labels in one pass", () => {
		const document = new DiagramAsTextDocument(
			[{ id: "vertex-1", label: "Existing" }],
			[{ label: "Existing" }, { label: "New" }, { label: "New" }]
		);

		document.removeDuplicates();

		assert.deepEqual(document.newVertices, [{ label: "New" }]);
	});
});
