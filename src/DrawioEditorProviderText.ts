import {
	CancellationToken,
	CustomTextEditorProvider,
	Range,
	TextDocument,
	WebviewPanel,
	window,
	workspace,
	WorkspaceEdit,
} from "vscode";
import formatter = require("xml-formatter");
import { DrawioEditorService } from "./DrawioEditorService";

// Debounce utility for performance optimization
function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | undefined;
	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}

export class DrawioEditorProviderText implements CustomTextEditorProvider {
	constructor(private readonly drawioEditorService: DrawioEditorService) {}

	public async resolveCustomTextEditor(
		document: TextDocument,
		webviewPanel: WebviewPanel,
		token: CancellationToken
	): Promise<void> {
		try {
			const readonlySchemes = new Set(["git", "conflictResolution"]);
			const isReadOnly = readonlySchemes.has(document.uri.scheme);

			const editor =
				await this.drawioEditorService.createDrawioEditorInWebview(
					webviewPanel,
					{
						kind: "text",
						document,
					},
					{ isReadOnly }
				);
			const drawioClient = editor.drawioClient;

			interface NormalizedDocument {
				equals(other: this): boolean;
			}

			function getNormalizedDocument(src: string): NormalizedDocument {
				const result = {
					src,
					equals: (o: any) => o.src === src,
				};
				return result;
			}

			let lastDocument = getNormalizedDocument(document.getText());
			let isThisEditorSaving = false;

			workspace.onDidChangeTextDocument(async (evt) => {
				if (evt.document !== document) {
					return;
				}
				if (isThisEditorSaving) {
					// We don't want to process our own changes.
					return;
				}
				if (evt.contentChanges.length === 0) {
					// Sometimes VS Code reports a document change without a change.
					return;
				}

				const newText = evt.document.getText();
				const newDocument = getNormalizedDocument(newText);
				if (newDocument.equals(lastDocument)) {
					return;
				}
				lastDocument = newDocument;

				await drawioClient.mergeXmlLike(newText);
			});

			// Store pending XML to process - debouncing ensures we use the latest
			let pendingXml: string | null = null;

			// Debounced function that processes the pending XML change
			// 100ms delay balances responsiveness with performance
			const processXmlChange = debounce(async () => {
				if (pendingXml === null) return;

				let xmlToProcess = pendingXml;
				pendingXml = null;

				// We format the xml so that it can be easily edited in a second text editor.
				async function getOutput(): Promise<string> {
					if (document.uri.path.endsWith(".svg")) {
						const svg =
							await drawioClient.exportAsSvgWithEmbeddedXml();
						xmlToProcess = svg.toString("utf-8");

						// This adds a host to track which files are created by this extension and which by draw.io desktop.
						xmlToProcess = xmlToProcess.replace(
							/^<svg /,
							() => `<svg host="65bd71144e" `
						);

						return formatter(xmlToProcess);
					} else {
						if (xmlToProcess.startsWith('<mxfile host="')) {
							xmlToProcess = xmlToProcess.replace(
								/^<mxfile host="(.*?)"/,
								() => `<mxfile host="65bd71144e"`
							);
						} else {
							// in case there is no host attribute
							xmlToProcess = xmlToProcess
								.replace(
									/^<mxfile /,
									() => `<mxfile host="65bd71144e"`
								)
								.replace(
									/^<mxfile>/,
									() => `<mxfile host="65bd71144e">`
								);
						}

						return formatter(
							// This normalizes the host
							xmlToProcess
						);
					}
				}

				const output = await getOutput();
				const newDocument = getNormalizedDocument(output);
				if (newDocument.equals(lastDocument)) {
					return;
				}
				lastDocument = newDocument;

				const workspaceEdit = new WorkspaceEdit();

				// TODO diff the new document with the old document and only edit the changes.
				workspaceEdit.replace(
					document.uri,
					new Range(0, 0, document.lineCount, 0),
					output
				);

				isThisEditorSaving = true;
				try {
					if (!(await workspace.applyEdit(workspaceEdit))) {
						window.showErrorMessage(
							"Could not apply Draw.io document changes to the underlying document. Try to save again!"
						);
					}
				} finally {
					isThisEditorSaving = false;
				}
			}, 100);

			drawioClient.onChange.sub(({ newXml }) => {
				pendingXml = newXml;
				processXmlChange();
			});

			drawioClient.onSave.sub(async () => {
				await document.save();
			});

			drawioClient.onInit.sub(async () => {
				drawioClient.loadXmlLike(document.getText());
			});
		} catch (e) {
			window.showErrorMessage(`Failed to open diagram: ${e}`);
			throw e;
		}
	}
}
