import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import { fromResource } from "../src/utils/fromResource";

describe("fromResource", () => {
	it("rejects reads after disposal", () => {
		const resource = fromResource(
			() => undefined,
			() => "value"
		);
		resource.dispose();

		assert.throws(
			() => resource.current(),
			/subscribingObservable has already been disposed/
		);
	});
});
