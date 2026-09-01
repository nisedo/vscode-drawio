import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import {
	ThrottleScheduler,
	ThrottledLatest,
} from "../drawio-custom-plugins/src/ThrottledLatest";

class ManualScheduler implements ThrottleScheduler {
	public now = 0;
	private nextId = 0;
	private readonly pending = new Map<
		number,
		{ callback: () => void; runAt: number }
	>();

	public get currentTime(): number {
		return this.now;
	}

	public set(callback: () => void, delayMs: number): number {
		const id = this.nextId++;
		this.pending.set(id, { callback, runAt: this.now + delayMs });
		return id;
	}

	public clear(handle: unknown): void {
		this.pending.delete(handle as number);
	}

	public advanceBy(milliseconds: number): void {
		this.now += milliseconds;
		for (const [id, task] of [...this.pending]) {
			if (task.runAt <= this.now) {
				this.pending.delete(id);
				task.callback();
			}
		}
	}
}

describe("ThrottledLatest", () => {
	it("sends the first value immediately and the latest burst value later", () => {
		const scheduler = new ManualScheduler();
		const values: number[] = [];
		const throttled = new ThrottledLatest(
			30,
			(value: number) => values.push(value),
			scheduler
		);

		throttled.schedule(1);
		throttled.schedule(2);
		throttled.schedule(3);

		assert.deepEqual(values, [1]);
		scheduler.advanceBy(29);
		assert.deepEqual(values, [1]);
		scheduler.advanceBy(1);
		assert.deepEqual(values, [1, 3]);
	});

	it("flushes the latest value immediately", () => {
		const scheduler = new ManualScheduler();
		const values: number[] = [];
		const throttled = new ThrottledLatest(
			30,
			(value: number) => values.push(value),
			scheduler
		);

		throttled.schedule(1);
		throttled.schedule(2);
		throttled.flush();

		assert.deepEqual(values, [1, 2]);
		scheduler.advanceBy(30);
		assert.deepEqual(values, [1, 2]);
	});

	it("cancels pending work when disposed", () => {
		const scheduler = new ManualScheduler();
		const values: number[] = [];
		const throttled = new ThrottledLatest(
			30,
			(value: number) => values.push(value),
			scheduler
		);

		throttled.schedule(1);
		throttled.schedule(2);
		throttled.dispose();
		scheduler.advanceBy(30);

		assert.deepEqual(values, [1]);
	});
});
