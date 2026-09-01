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
import { DebouncedLatestTask } from "./utils/DebouncedLatestTask";

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

			// Track last document text for change detection (simple string comparison)
			let lastDocumentText = document.getText();
			let isThisEditorSaving = false;

			editor.dispose.track(
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
					if (newText === lastDocumentText) {
						return;
					}
					lastDocumentText = newText;

					await drawioClient.mergeXmlLike(newText);
				})
			);

			// A single queue coalesces bursts and prevents older async writes from
			// completing after newer writes.
			const processXmlChange = new DebouncedLatestTask(
				async (newXml: string) => {
					let xmlToProcess = newXml;

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
					if (output === lastDocumentText) {
						return;
					}
					lastDocumentText = output;

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
				},
				100
			);
			editor.dispose.track(processXmlChange);

			editor.dispose.track(
				drawioClient.onChange.sub(({ newXml }) => {
					processXmlChange.enqueue(newXml);
				})
			);

			editor.dispose.track(
				drawioClient.onSave.sub(async () => {
					await processXmlChange.flush();
					await document.save();
				})
			);

			editor.dispose.track(
				drawioClient.onInit.sub(async () => {
					await drawioClient.loadXmlLike(document.getText());
				})
			);
		} catch (e) {
			window.showErrorMessage(`Failed to open diagram: ${e}`);
			throw e;
		}
	}
}
