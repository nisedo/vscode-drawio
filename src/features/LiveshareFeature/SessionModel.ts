import { action, ObservableMap } from "mobx";

export interface Point {
	x: number;
	y: number;
}
// is a string
export type NormalizedUri = { __brand: "normalizedUri" };

export type ViewState =
	| {
			activeUri: NormalizedUri;
			currentCursor: Point | undefined;
			selectedCellIds: string[];
			selectedRectangle: Rectangle | undefined;
	  }
	| undefined;

export class SessionModel {
	public readonly viewStatesByPeerId = new ObservableMap<
		number,
		{ viewState: ViewState; peerId: number }
	>();

	@action
	public apply(update: SessionModelUpdate): void {
		if (update.kind === "updateViewState") {
			const val = this.viewStatesByPeerId.get(update.peerId);
			const newVal = {
				peerId: update.peerId,
				viewState: update.newViewState,
			};
			if (
				!val ||
				val.peerId !== newVal.peerId ||
				!viewStateEquals(val.viewState, newVal.viewState)
			) {
				this.viewStatesByPeerId.set(update.peerId, newVal);
			}
		}
		if (update.kind === "removePeer") {
			this.viewStatesByPeerId.delete(update.peerId);
		}
	}
}

export type SessionModelUpdate =
	| {
			kind: "updateViewState";
			peerId: number;
			newViewState: ViewState;
	  }
	| {
			kind: "removePeer";
			peerId: number;
	  };

function viewStateEquals(a: ViewState, b: ViewState): boolean {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}

	return (
		a.activeUri === b.activeUri &&
		pointEquals(a.currentCursor, b.currentCursor) &&
		rectangleEquals(a.selectedRectangle, b.selectedRectangle) &&
		stringArrayEquals(a.selectedCellIds, b.selectedCellIds)
	);
}

function pointEquals(a: Point | undefined, b: Point | undefined): boolean {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	return a.x === b.x && a.y === b.y;
}

function rectangleEquals(
	a: Rectangle | undefined,
	b: Rectangle | undefined
): boolean {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	return (
		a.start.x === b.start.x &&
		a.start.y === b.start.y &&
		a.end.x === b.end.x &&
		a.end.y === b.end.y
	);
}

function stringArrayEquals(a: string[], b: string[]): boolean {
	if (a === b) {
		return true;
	}
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
