import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import {
	CoalescedRunner,
	TimerScheduler,
} from "../drawio-custom-plugins/src/CoalescedRunner";

class ManualScheduler implements TimerScheduler {
	private nextId = 0;
	private readonly callbacks = new Map<number, () => void>();

	public set(callback: () => void): number {
		const id = this.nextId++;
		this.callbacks.set(id, callback);
		return id;
	}

	public clear(id: unknown): void {
		this.callbacks.delete(id as number);
	}

	public runAll(): void {
		const callbacks = [...this.callbacks.values()];
		this.callbacks.clear();
		for (const callback of callbacks) {
			callback();
		}
	}

	public get size(): number {
		return this.callbacks.size;
	}
}

describe("CoalescedRunner", () => {
	it("runs once for a burst of schedules", () => {
		const scheduler = new ManualScheduler();
		let runs = 0;
		const runner = new CoalescedRunner(() => runs++, 100, scheduler);

		runner.schedule();
		runner.schedule();
		runner.schedule();

		assert.equal(scheduler.size, 1);
		scheduler.runAll();
		assert.equal(runs, 1);
	});

	it("can schedule a later reconciliation", () => {
		const scheduler = new ManualScheduler();
		let runs = 0;
		const runner = new CoalescedRunner(() => runs++, 100, scheduler);

		runner.schedule();
		scheduler.runAll();
		runner.schedule();
		scheduler.runAll();

		assert.equal(runs, 2);
	});

	it("cancels pending work when disposed", () => {
		const scheduler = new ManualScheduler();
		let runs = 0;
		const runner = new CoalescedRunner(() => runs++, 100, scheduler);

		runner.schedule();
		runner.dispose();
		scheduler.runAll();

		assert.equal(runs, 0);
	});
});
