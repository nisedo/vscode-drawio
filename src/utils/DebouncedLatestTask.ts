export interface TimerScheduler {
	set(callback: () => void, delay: number): unknown;
	clear(handle: unknown): void;
}

const systemScheduler: TimerScheduler = {
	set: (callback, delay) => setTimeout(callback, delay),
	clear: (handle) => clearTimeout(handle as NodeJS.Timeout),
};

/**
 * Coalesces pending values and processes them in order without overlapping work.
 */
export class DebouncedLatestTask<T> {
	private hasPendingValue = false;
	private pendingValue!: T;
	private timer: unknown | undefined;
	private running = Promise.resolve();
	private isDisposed = false;

	public constructor(
		private readonly handle: (value: T) => Promise<void>,
		private readonly delay: number,
		private readonly scheduler: TimerScheduler = systemScheduler,
		private readonly handleBackgroundError: (
			error: unknown
		) => void = console.error
	) {}

	public enqueue(value: T): void {
		if (this.isDisposed) {
			return;
		}

		this.pendingValue = value;
		this.hasPendingValue = true;
		this.clearTimer();
		this.timer = this.scheduler.set(() => {
			this.timer = undefined;
			void this.startPendingWork().catch(this.handleBackgroundError);
		}, this.delay);
	}

	public async flush(): Promise<void> {
		this.clearTimer();
		if (this.isDisposed) {
			return;
		}
		await this.startPendingWork();
	}

	public dispose(): void {
		this.isDisposed = true;
		this.hasPendingValue = false;
		this.clearTimer();
	}

	private startPendingWork(): Promise<void> {
		const previous = this.running.catch(() => undefined);
		this.running = previous.then(async () => {
			while (this.hasPendingValue && !this.isDisposed) {
				const value = this.pendingValue;
				this.hasPendingValue = false;
				await this.handle(value);
			}
		});
		return this.running;
	}

	private clearTimer(): void {
		if (this.timer !== undefined) {
			this.scheduler.clear(this.timer);
			this.timer = undefined;
		}
	}
}
