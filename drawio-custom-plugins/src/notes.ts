import { sendEvent } from "./vscode";

// Small black triangle SVG as data URI (6x6 pixels)
const NOTE_INDICATOR_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6">
  <polygon points="0,0 6,0 6,6" fill="#000000"/>
</svg>
`)}`;

// Track overlays per cell
const cellOverlays = new Map<string, mxCellOverlay>();

Draw.loadPlugin((ui) => {
	sendEvent({ event: "pluginLoaded", pluginId: "notes" });

	const graph = ui.editor.graph;
	const model = graph.model;

	/**
	 * Get the note (tooltip) from a cell
	 */
	function getCellNote(cell: DrawioCell): string | null {
		if (!cell || !cell.value) return null;

		if (mxUtils.isNode(cell.value)) {
			const tooltip = cell.value.getAttribute("tooltip");
			return tooltip || null;
		}
		return null;
	}

	/**
	 * Set the note (tooltip) on a cell
	 */
	function setCellNote(cell: DrawioCell, note: string | null): void {
		if (!cell) return;

		model.beginUpdate();
		try {
			let newValue: any;

			if (mxUtils.isNode(cell.value)) {
				// Clone the existing node
				newValue = cell.value.cloneNode(true) as HTMLElement;
			} else {
				// Create a new object node
				const doc = mxUtils.createXmlDocument();
				newValue = doc.createElement("object");
				newValue.setAttribute("label", cell.value || "");
			}

			if (note && note.trim()) {
				newValue.setAttribute("tooltip", note);
			} else {
				newValue.removeAttribute("tooltip");
			}

			model.setValue(cell, newValue);
		} finally {
			model.endUpdate();
		}

		// Update visual indicator
		updateNoteIndicator(cell);
	}

	/**
	 * Add or remove the note indicator overlay on a cell
	 */
	function updateNoteIndicator(cell: DrawioCell): void {
		if (!cell) return;

		const hasNote = !!getCellNote(cell);
		const existingOverlay = cellOverlays.get(cell.id);

		if (hasNote && !existingOverlay) {
			// Add overlay
			const image = new mxImage(NOTE_INDICATOR_SVG, 6, 6);
			const overlay = new mxCellOverlay(
				image,
				"", // No tooltip on the overlay itself
				mxConstants.ALIGN_RIGHT,
				mxConstants.ALIGN_TOP,
				new mxPoint(0, 0),
				"default"
			);
			graph.addCellOverlay(cell, overlay);
			cellOverlays.set(cell.id, overlay);
		} else if (!hasNote && existingOverlay) {
			// Remove overlay
			graph.removeCellOverlay(cell, existingOverlay);
			cellOverlays.delete(cell.id);
		}
	}

	/**
	 * Initialize overlays for all existing cells with notes
	 */
	function initializeOverlays(): void {
		const cells = model.cells;
		for (const id in cells) {
			const cell = cells[id];
			if (model.isVertex(cell) || model.isEdge(cell)) {
				updateNoteIndicator(cell);
			}
		}
	}

	/**
	 * Show the note editor dialog
	 */
	function showNoteDialog(cell: DrawioCell, isNew: boolean): void {
		const currentNote = getCellNote(cell) || "";

		const div = document.createElement("div");
		div.style.cssText = `
			font-family: Segoe WPC, Segoe UI, sans-serif;
			display: flex;
			flex-direction: column;
			height: 100%;
			padding: 10px;
			box-sizing: border-box;
		`;

		const title = document.createElement("h3");
		title.textContent = isNew ? "Insert Note" : "Edit Note";
		title.style.cssText = "margin: 0 0 10px 0; font-size: 14px;";
		div.appendChild(title);

		const textarea = document.createElement("textarea");
		textarea.value = currentNote;
		textarea.placeholder = "Enter your note here...";
		textarea.style.cssText = `
			flex: 1;
			resize: none;
			padding: 8px;
			font-family: inherit;
			font-size: 13px;
			border: 1px solid #ccc;
			border-radius: 4px;
			margin-bottom: 10px;
		`;
		div.appendChild(textarea);

		const buttonRow = document.createElement("div");
		buttonRow.style.cssText = "display: flex; justify-content: flex-end; gap: 8px;";

		const cancelBtn = document.createElement("button");
		cancelBtn.textContent = mxResources.get("cancel") || "Cancel";
		cancelBtn.className = "geBtn";
		cancelBtn.onclick = () => ui.hideDialog();
		buttonRow.appendChild(cancelBtn);

		const saveBtn = document.createElement("button");
		saveBtn.textContent = mxResources.get("apply") || "Apply";
		saveBtn.className = "geBtn gePrimaryBtn";
		saveBtn.onclick = () => {
			setCellNote(cell, textarea.value);
			ui.hideDialog();
		};
		buttonRow.appendChild(saveBtn);

		div.appendChild(buttonRow);

		ui.showDialog(div, 300, 200, true, true);

		// Focus the textarea
		setTimeout(() => textarea.focus(), 100);

		// Handle Enter (with Ctrl/Cmd for newlines) and Escape
		textarea.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				ui.hideDialog();
			} else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				setCellNote(cell, textarea.value);
				ui.hideDialog();
			}
		});
	}

	/**
	 * Override the popup menu to add note menu items
	 */
	const originalFactoryMethod = graph.popupMenuHandler.factoryMethod;
	graph.popupMenuHandler.factoryMethod = function(menu: mxPopupMenu, cell: DrawioCell | null, evt: Event) {
		// Call original method first
		if (originalFactoryMethod) {
			originalFactoryMethod.call(this, menu, cell, evt);
		}

		// Only add note options for vertices and edges (not empty canvas)
		if (cell && (model.isVertex(cell) || model.isEdge(cell))) {
			const hasNote = !!getCellNote(cell);

			menu.addSeparator();

			if (hasNote) {
				// Edit note option
				menu.addItem("Edit note", null, () => {
					showNoteDialog(cell, false);
				});

				// Delete note option
				menu.addItem("Delete note", null, () => {
					setCellNote(cell, null);
				});
			} else {
				// Insert note option
				menu.addItem("Insert note", null, () => {
					showNoteDialog(cell, true);
				});
			}
		}
	};

	// Initialize overlays after a short delay to ensure the graph is loaded
	setTimeout(() => {
		initializeOverlays();
	}, 500);

	// Listen for model changes to update overlays
	model.addListener(mxEvent.CHANGE, () => {
		// Re-scan all cells for notes when the model changes
		setTimeout(() => {
			const cells = model.cells;
			for (const id in cells) {
				const cell = cells[id];
				if (model.isVertex(cell) || model.isEdge(cell)) {
					updateNoteIndicator(cell);
				}
			}
		}, 100);
	});
});
