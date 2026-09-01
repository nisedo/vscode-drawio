export interface Identified {
	id: string;
}

export interface DisposableIdentified extends Identified {
	dispose(): void;
}

export function reconcileById<
	TData extends Identified,
	TRendered extends DisposableIdentified
>(
	current: Map<string, TRendered>,
	next: readonly TData[],
	create: (data: TData) => TRendered,
	update: (rendered: TRendered, data: TData) => void
): void {
	const nextIds = new Set(next.map((item) => item.id));
	for (const [id, rendered] of current) {
		if (!nextIds.has(id)) {
			current.delete(id);
			rendered.dispose();
		}
	}

	for (const data of next) {
		let rendered = current.get(data.id);
		if (!rendered) {
			rendered = create(data);
			current.set(data.id, rendered);
		}
		update(rendered, data);
	}
}
