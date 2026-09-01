import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import {
	DebouncedLatestTask,
	TimerScheduler,
} from "../src/utils/DebouncedLatestTask";

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

function deferred(): {
	promise: Promise<void>;
	resolve: () => void;
} {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

describe("DebouncedLatestTask", () => {
	it("coalesces queued values to the latest value", async () => {
		const scheduler = new ManualScheduler();
		const handled: string[] = [];
		const task = new DebouncedLatestTask(
			async (value: string) => {
				handled.push(value);
			},
			100,
			scheduler
		);

		task.enqueue("first");
		task.enqueue("latest");

		assert.equal(scheduler.size, 1);
		scheduler.runAll();
		await task.flush();
		assert.deepEqual(handled, ["latest"]);
	});

	it("serializes work queued while a task is running", async () => {
		const scheduler = new ManualScheduler();
		const firstStarted = deferred();
		const firstCanFinish = deferred();
		const handled: string[] = [];
		let active = 0;
		let maxActive = 0;
		const task = new DebouncedLatestTask(
			async (value: string) => {
				active++;
				maxActive = Math.max(maxActive, active);
				handled.push(value);
				if (value === "first") {
					firstStarted.resolve();
					await firstCanFinish.promise;
				}
				active--;
			},
			100,
			scheduler
		);

		task.enqueue("first");
		const firstFlush = task.flush();
		await firstStarted.promise;
		task.enqueue("second");
		const secondFlush = task.flush();
		firstCanFinish.resolve();

		await Promise.all([firstFlush, secondFlush]);
		assert.deepEqual(handled, ["first", "second"]);
		assert.equal(maxActive, 1);
	});

	it("cancels pending work when disposed", async () => {
		const scheduler = new ManualScheduler();
		const handled: string[] = [];
		const task = new DebouncedLatestTask(
			async (value: string) => {
				handled.push(value);
			},
			100,
			scheduler
		);

		task.enqueue("discarded");
		task.dispose();
		scheduler.runAll();
		await task.flush();

		assert.deepEqual(handled, []);
	});
});
