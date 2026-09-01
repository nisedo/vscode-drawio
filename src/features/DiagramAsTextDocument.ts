export class DiagramAsTextDocument {
	public static parse(src: string): DiagramAsTextDocument {
		const lines = src.split(/\r?\n/);
		const vertexUpdates = new Array<{ id: string; label: string }>();
		const newVertices = new Array<{ label: string }>();

		for (const line of lines) {
			if (line.length === 0) {
				continue;
			}
			const separatorIndex = line.indexOf(":");
			if (separatorIndex === -1) {
				newVertices.push({ label: line });
			} else {
				vertexUpdates.push({
					id: line.slice(0, separatorIndex),
					label: line.slice(separatorIndex + 1),
				});
			}
		}

		return new DiagramAsTextDocument(vertexUpdates, newVertices);
	}

	public constructor(
		public vertexUpdates: { id: string; label: string }[],
		public newVertices: { label: string }[]
	) {}

	public toString(): string {
		return [
			...this.vertexUpdates.map(
				(vertex) => `${vertex.id}:${vertex.label}`
			),
			...this.newVertices.map((vertex) => vertex.label),
		].join("\n");
	}

	public removeDuplicates(): void {
		const labels = new Set(
			this.vertexUpdates.map((vertex) => vertex.label)
		);
		this.newVertices = this.newVertices.filter((vertex) => {
			if (labels.has(vertex.label)) {
				return false;
			}
			labels.add(vertex.label);
			return true;
		});
	}
}
