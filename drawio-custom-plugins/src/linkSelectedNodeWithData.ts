import {
	ConservativeFlattenedEntryParser,
	FlattenToDictionary,
	JSONValue,
} from "@hediet/json-to-dictionary";
import { sendEvent } from "./vscode";

Draw.loadPlugin((ui) => {
	sendEvent({ event: "pluginLoaded", pluginId: "linkSelectedNodeWithData" });

	let nodeSelectionEnabled = false;
	const graph = ui.editor.graph;
	const highlight = new mxCellHighlight(graph, "#00ff00", 8);

	const model = graph.model;
	let activeCell: DrawioCell | undefined = undefined;

	graph.addListener(mxEvent.DOUBLE_CLICK, function (_sender: any, evt: any) {
		if (!nodeSelectionEnabled) {
			return;
		}

		var cell: any | null = evt.getProperty("cell");
		if (cell == null)
			return;
		const data = getLinkedData(cell);
		const label = getLabelTextOfCell(cell);

		if (!data && !label.match(/#([a-zA-Z0-9_]+)/)) {
			return;
		}

		sendEvent({ event: "nodeSelected", label, linkedData: data });
		evt.consume();
	});

	function getLabelTextOfCell(cell: any): string {
		const labelHtml = graph.getLabel(cell);
		const el = document.createElement("html");
		el.innerHTML = labelHtml; // label can be html
		return el.innerText;
	}

	const selectionModel = graph.getSelectionModel();
	selectionModel.addListener(mxEvent.CHANGE, (_sender: any, _evt: any) => {
		// selection has changed
		const cells = selectionModel.cells;
		if (cells.length >= 1) {
			const selectedCell = cells[0];
			activeCell = selectedCell;
			(window as any).hediet_Cell = selectedCell;
		} else {
			activeCell = undefined;
		}
	});

	const prefix = "hedietLinkedDataV1";
	const flattener = new FlattenToDictionary({
		parser: new ConservativeFlattenedEntryParser({
			prefix,
			separator: "_",
		}),
	});

	function getLinkedData(cell: { value: unknown }) {
		if (!mxUtils.isNode(cell.value)) {
			return undefined;
		}
		const kvs = [...(cell.value.attributes as any)]
			.filter((a) => a.name.startsWith(prefix))
			.map((a) => [a.name, a.value]);
		if (kvs.length === 0) {
			return undefined;
		}

		const r: Record<string, string> = {};
		for (const [k, v] of kvs) {
			r[k] = v;
		}
		return flattener.unflatten(r);
	}

	function setLinkedData(cell: any, linkedData: JSONValue) {
		let newNode: HTMLElement;
		if (!mxUtils.isNode(cell.value)) {
			const doc = mxUtils.createXmlDocument();
			const obj = doc.createElement("object");
			obj.setAttribute("label", cell.value || "");
			newNode = obj;
		} else {
			newNode = cell.value.cloneNode(true);
		}

		for (const a of [
			...((newNode.attributes as any) as { name: string }[]),
		]) {
			if (a.name.startsWith(prefix)) {
				newNode.attributes.removeNamedItem(a.name);
			}
		}

		const kvp = flattener.flatten(linkedData);
		for (const [k, v] of Object.entries(kvp)) {
			newNode.setAttribute(k, v);
		}

		// don't use cell.setValue as it does not trigger a change
		model.setValue(cell, newNode);
	}

	window.addEventListener("message", (evt) => {
		if (evt.source !== window.opener) {
			return;
		}

		const data = JSON.parse(evt.data) as CustomDrawioAction;

		switch (data.action) {
			case "setNodeSelectionEnabled": {
				nodeSelectionEnabled = data.enabled;
				break;
			}
			case "linkSelectedNodeWithData": {
				if (activeCell !== undefined) {
					log("Set linkedData to " + data.linkedData);
					graph.model.beginUpdate();
					try {
						setLinkedData(activeCell, data.linkedData);
					} finally {
						graph.model.endUpdate();
					}
					highlight.highlight(graph.view.getState(activeCell));
					setTimeout(() => {
						highlight.highlight(null);
					}, 500);
				}
				break;
			}
			case "getVertices": {
				const vertices = Object.values(graph.model.cells)
					.filter((c) => graph.model.isVertex(c))
					.map((c: any) => ({ id: c.id, label: graph.getLabel(c) }));
				sendEvent({
					event: "getVertices",
					message: data,
					vertices: vertices,
				});
				break;
			}
			case "updateVertices": {
				const vertices = data.verticesToUpdate;

				graph.model.beginUpdate();
				try {
					for (const v of vertices) {
						const c = graph.model.cells[v.id];
						if (!c) {
							log(`Unknown cell "${v.id}"!`);
							continue;
						}
						if (graph.getLabel(c) !== v.label) {
							graph.model.setValue(c, v.label);
						}
					}
				} finally {
					graph.model.endUpdate();
				}
				break;
			}
			case "addVertices": {
				log("add vertices is being called");
				const vertices = data.vertices;

				graph.model.beginUpdate();
				try {
					let i = 0;
					for (const v of vertices) {
						// Use provided position or fallback to default grid layout
						const x = v.x !== undefined ? v.x : i * 120;
						const y = v.y !== undefined ? v.y : 0;

						const newCell = graph.insertVertex(
							undefined,
							null,
							v.label,
							x,
							y,
							100,
							50,
							"rounded=0;whiteSpace=wrap;html=1;rotatable=0"
						);

						// If linkedData is provided, attach it to the cell
						if (v.linkedData && newCell) {
							setLinkedData(newCell, v.linkedData);
						}
						i++;
					}
				} finally {
					graph.model.endUpdate();
				}
				break;
			}
			case "getSelectedCellGeometry": {
				let geometry = null;
				if (activeCell) {
					const geo = graph.getCellGeometry(activeCell);
					if (geo) {
						geometry = { x: geo.x, y: geo.y, width: geo.width, height: geo.height };
					}
				}
				sendEvent({
					event: "getSelectedCellGeometry",
					message: data,
					geometry: geometry,
				});
				break;
			}
			case "createPageFromFile": {
				const { fileName, fileLinkedData, symbols } = data;

				// Create a new page
				const page = ui.createPage(fileName);
				const change = new ChangePage(ui, page, page, ui.pages.length);
				graph.model.execute(change);
				ui.selectPage(page);

				// Calculate container dimensions based on number of symbols
				const nodeHeight = 40;
				const nodeSpacing = 10;
				const headerHeight = 30;
				const containerWidth = 300;
				const containerHeight = headerHeight + (symbols.length * (nodeHeight + nodeSpacing)) + nodeSpacing;

				graph.model.beginUpdate();
				try {
					// Create container node for the file
					const container = graph.insertVertex(
						graph.getDefaultParent(),
						null,
						fileName,
						50,
						50,
						containerWidth,
						containerHeight,
						"rounded=0;whiteSpace=wrap;html=1;container=1;collapsible=0;rotatable=0;verticalAlign=top;fontStyle=1"
					);

					// Attach file linked data to the container
					if (fileLinkedData && container) {
						setLinkedData(container, fileLinkedData);
					}

					// Create child nodes for each symbol
					let yOffset = headerHeight + nodeSpacing;
					for (const symbol of symbols) {
						const childNode = graph.insertVertex(
							container,
							null,
							symbol.label,
							10,
							yOffset,
							containerWidth - 20,
							nodeHeight,
							"rounded=0;whiteSpace=wrap;html=1;rotatable=0"
						);

						// Attach symbol linked data to the child node
						if (symbol.linkedData && childNode) {
							setLinkedData(childNode, symbol.linkedData);
						}

						yOffset += nodeHeight + nodeSpacing;
					}
				} finally {
					graph.model.endUpdate();
				}
				break;
			}
			default: {
				return;
			}
		}

		evt.preventDefault();
		evt.stopPropagation();
	});
});
