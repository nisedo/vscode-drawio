declare const Draw: {
    loadPlugin(handler: (ui: DrawioUI) => void): void;
};

declare const log: any;
declare class mxCellHighlight {
    constructor(graph: DrawioGraph, color: string, arg: number);

    public highlight(arg: DrawioCellState | null): void;
    public destroy(): void;
}

declare class mxResources {
    static parse(value: string): void;
    static get(key: string): string;
}

declare class mxMouseEvent {
    public readonly graphX: number;
    public readonly graphY: number;
}

declare const mxEvent: {
    DOUBLE_CLICK: string;
    CHANGE: string;
};

declare const mxUtils: {
	isNode(node: any): node is HTMLElement;
	createXmlDocument(): XMLDocument;
};

// mxCellOverlay for visual indicators
declare class mxCellOverlay {
    constructor(image: mxImage, tooltip?: string, align?: string, verticalAlign?: string, offset?: mxPoint, cursor?: string);
    align: string;
    verticalAlign: string;
    offset: mxPoint;
}

declare class mxImage {
    constructor(src: string, width: number, height: number);
}

declare class mxPoint {
    constructor(x: number, y: number);
}

declare const mxConstants: {
    ALIGN_RIGHT: string;
    ALIGN_TOP: string;
    ALIGN_LEFT: string;
    ALIGN_BOTTOM: string;
    ALIGN_CENTER: string;
};

// mxPopupMenu for context menus
declare class mxPopupMenu {
    addItem(title: string, image: string | null, funct: () => void, parent?: any, iconCls?: string, enabled?: boolean): any;
    addSeparator(parent?: any): void;
}

declare interface DrawioUI {
    fileNode: Element | null;
    hideDialog(): void;
    showDialog(div: HTMLElement, width: number, height: number, modal?: boolean, closable?: boolean, onClose?: () => void): void;
    editor: DrawioEditor;
    actions: DrawioActions;
    menus: DrawioMenus;
    importLocalFile(args: boolean): void;
}

interface DrawioMenus {
    get(name: string): any;
    addMenuItems(menu: any, arg: any, arg2: any): void;
    createPopupMenu(menu: any, cell: DrawioCell | null, evt: Event): void;
}

interface DrawioActions {
    addAction(name: string, action: () => void): void;
    get(name: string): { funct: () => void };
}

declare interface DrawioEditor {
	graph: DrawioGraph;
}

declare interface mxGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
}

declare interface DrawioGraph {
	defaultThemeName: string;
	insertVertex(arg0: undefined, arg1: null, label: string, x: number, y: number, width: number, height: number, style: string): DrawioCell;
	addListener: any;
	model: DrawioGraphModel;
	getLabel(cell: DrawioCell): string;
    getSelectionModel(): DrawioGraphSelectionModel;
    view: DrawioGraphView;
    addCellOverlay(cell: DrawioCell, overlay: mxCellOverlay): mxCellOverlay;
    removeCellOverlay(cell: DrawioCell, overlay?: mxCellOverlay): mxCellOverlay | null;
    removeCellOverlays(cell: DrawioCell): mxCellOverlay[];
    getCellOverlays(cell: DrawioCell): mxCellOverlay[] | null;
    getTooltipForCell(cell: DrawioCell): string;
    getSelectionCell(): DrawioCell | null;
    getSelectionCells(): DrawioCell[];
    getCellGeometry(cell: DrawioCell): mxGeometry | null;
    popupMenuHandler: {
        factoryMethod: (menu: any, cell: DrawioCell | null, evt: Event) => void;
    };

    addMouseListener(listener: {
        mouseMove?: (graph: DrawioGraph, event: mxMouseEvent) => void;
        mouseDown?: (graph: DrawioGraph, event: mxMouseEvent) => void
        mouseUp?: (graph: DrawioGraph, event: mxMouseEvent) => void;
    }): void;
}

declare interface DrawioGraphView {
    getState(cell: DrawioCell): DrawioCellState;
    canvas: SVGElement;
}

declare interface DrawioCellState {
    cell: DrawioCell;
}

declare interface DrawioGraphSelectionModel {
	addListener(event: string, handler: (...args: any[]) => void): void;
    cells: DrawioCell[];
}

declare interface DrawioCell {
    id: string;
    style: string;
    value: any;
}

declare interface DrawioGraphModel {
    setValue(c: DrawioCell, label: string | any): void;
    beginUpdate(): void;
    endUpdate(): void;
	cells: Record<any, DrawioCell>;
    setStyle(cell: DrawioCell, style: string): void;
    isVertex(cell: DrawioCell): boolean;
    isEdge(cell: DrawioCell): boolean;
    addListener(event: string, handler: (...args: any[]) => void): void;
}
