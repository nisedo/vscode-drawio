export interface TimerScheduler {
	set(callback: () => void, delay: number): unknown;
	clear(handle: unknown): void;
}

const systemScheduler: TimerScheduler = {
	set: (callback, delay) => setTimeout(callback, delay),
	clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class CoalescedRunner {
	private timer: unknown | undefined;
	private isDisposed = false;

	public constructor(
		private readonly run: () => void,
		private readonly delay: number,
		private readonly scheduler: TimerScheduler = systemScheduler
	) {}

	public schedule(): void {
		if (this.isDisposed) {
			return;
		}
		if (this.timer !== undefined) {
			this.scheduler.clear(this.timer);
		}
		this.timer = this.scheduler.set(() => {
			this.timer = undefined;
			this.run();
		}, this.delay);
	}

	public dispose(): void {
		this.isDisposed = true;
		if (this.timer !== undefined) {
			this.scheduler.clear(this.timer);
			this.timer = undefined;
		}
	}
}
