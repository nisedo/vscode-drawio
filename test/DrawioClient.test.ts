import assert = require("node:assert/strict");
import { describe, it } from "node:test";
import { Disposable } from "@hediet/std/disposable";
import {
	DrawioClient,
	DrawioClientTimerScheduler,
	MessageStream,
} from "../src/DrawioClient/DrawioClient";

interface TestAction {
	action: "test";
}

interface TestEvent {
	event: "test";
	message: TestAction & { actionId: string };
}

class TestDrawioClient extends DrawioClient<TestAction, TestEvent> {
	public request(): Promise<TestEvent> {
		return this.sendCustomActionExpectResponse({ action: "test" });
	}
}

class FakeMessageStream implements MessageStream {
	public readonly sent: string[] = [];
	private handler: ((message: unknown) => void) | undefined;

	public registerMessageHandler(
		handler: (message: unknown) => void
	): Disposable {
		this.handler = handler;
		return Disposable.create(() => {
			this.handler = undefined;
		});
	}

	public sendMessage(message: unknown): void {
		this.sent.push(message as string);
	}

	public receive(message: TestEvent): void {
		this.handler?.(JSON.stringify(message));
	}
}

class ManualTimerScheduler implements DrawioClientTimerScheduler {
	private nextId = 0;
	private readonly callbacks = new Map<number, () => void>();

	public set(callback: () => void): number {
		const id = this.nextId++;
		this.callbacks.set(id, callback);
		return id;
	}

	public clear(handle: unknown): void {
		this.callbacks.delete(handle as number);
	}

	public runAll(): void {
		for (const [id, callback] of [...this.callbacks]) {
			this.callbacks.delete(id);
			callback();
		}
	}

	public get pendingCount(): number {
		return this.callbacks.size;
	}
}

function createClient() {
	const stream = new FakeMessageStream();
	const scheduler = new ManualTimerScheduler();
	const client = new TestDrawioClient(
		stream,
		async () => ({}),
		() => {},
		{
			responseTimeoutMs: 100,
			timerScheduler: scheduler,
		}
	);
	return { client, scheduler, stream };
}

describe("DrawioClient request lifecycle", () => {
	it("rejects a request when it times out", async () => {
		const { client, scheduler } = createClient();
		const request = client.request();

		scheduler.runAll();

		await assert.rejects(request, /timed out/i);
		assert.equal(scheduler.pendingCount, 0);
	});

	it("clears the timeout when a response arrives", async () => {
		const { client, scheduler, stream } = createClient();
		const request = client.request();
		const sent = JSON.parse(stream.sent[0]) as TestAction & {
			actionId: string;
		};
		const response: TestEvent = {
			event: "test",
			message: sent,
		};

		stream.receive(response);

		assert.deepEqual(await request, response);
		assert.equal(scheduler.pendingCount, 0);
	});

	it("rejects pending requests when disposed", async () => {
		const { client, scheduler } = createClient();
		const request = client.request();

		client.dispose();

		await assert.rejects(request, /disposed/i);
		assert.equal(scheduler.pendingCount, 0);
	});
});
