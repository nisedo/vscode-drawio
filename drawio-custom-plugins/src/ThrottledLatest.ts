export interface ThrottleScheduler {
	readonly currentTime: number;
	set(callback: () => void, delayMs: number): unknown;
	clear(handle: unknown): void;
}

const defaultScheduler: ThrottleScheduler = {
	get currentTime() {
		return Date.now();
	},
	set: (callback, delayMs) => setTimeout(callback, delayMs),
	clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class ThrottledLatest<T> {
	private lastRunAt = Number.NEGATIVE_INFINITY;
	private pendingValue: T | undefined;
	private hasPendingValue = false;
	private timer: unknown;
	private isDisposed = false;

	public constructor(
		private readonly intervalMs: number,
		private readonly run: (value: T) => void,
		private readonly scheduler: ThrottleScheduler = defaultScheduler
	) {}

	public schedule(value: T): void {
		if (this.isDisposed) {
			return;
		}

		this.pendingValue = value;
		this.hasPendingValue = true;
		const remainingMs =
			this.intervalMs - (this.scheduler.currentTime - this.lastRunAt);
		if (remainingMs <= 0) {
			this.flush();
		} else if (this.timer === undefined) {
			this.timer = this.scheduler.set(() => {
				this.timer = undefined;
				this.flush();
			}, remainingMs);
		}
	}

	public flush(): void {
		if (this.isDisposed || !this.hasPendingValue) {
			return;
		}

		if (this.timer !== undefined) {
			this.scheduler.clear(this.timer);
			this.timer = undefined;
		}
		const value = this.pendingValue as T;
		this.pendingValue = undefined;
		this.hasPendingValue = false;
		this.lastRunAt = this.scheduler.currentTime;
		this.run(value);
	}

	public dispose(): void {
		this.isDisposed = true;
		if (this.timer !== undefined) {
			this.scheduler.clear(this.timer);
			this.timer = undefined;
		}
		this.pendingValue = undefined;
		this.hasPendingValue = false;
	}
}
