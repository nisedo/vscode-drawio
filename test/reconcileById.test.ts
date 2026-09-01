import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import { reconcileById } from "../drawio-custom-plugins/src/reconcileById";

class RenderedParticipant {
	public updates = 0;
	public disposals = 0;

	public constructor(public readonly id: string) {}

	public dispose(): void {
		this.disposals++;
	}
}

describe("reconcileById", () => {
	it("removes a stale item while another item remains", () => {
		const stale = new RenderedParticipant("stale");
		const retained = new RenderedParticipant("retained");
		const current = new Map([
			[stale.id, stale],
			[retained.id, retained],
		]);

		reconcileById(
			current,
			[{ id: "retained" }],
			(item) => new RenderedParticipant(item.id),
			(item) => item.updates++
		);

		assert.deepEqual([...current.keys()], ["retained"]);
		assert.equal(stale.disposals, 1);
		assert.equal(retained.disposals, 0);
		assert.equal(retained.updates, 1);
	});

	it("reuses existing items and creates missing items", () => {
		const retained = new RenderedParticipant("retained");
		const current = new Map([[retained.id, retained]]);

		reconcileById(
			current,
			[{ id: "retained" }, { id: "new" }],
			(item) => new RenderedParticipant(item.id),
			(item) => item.updates++
		);

		assert.equal(current.get("retained"), retained);
		assert.equal(current.get("new")?.updates, 1);
		assert.equal(current.size, 2);
	});
});
