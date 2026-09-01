import { Disposable } from "@hediet/std/disposable";
import { workspace, window, ViewColumn, TextDocument } from "vscode";
import { DrawioEditorService } from "../DrawioEditorService";
import { DrawioFileSystemController } from "../vscode-utils/VirtualFileSystemProvider";
import { registerFailableCommand } from "../utils/registerFailableCommand";
import { DiagramAsTextDocument } from "./DiagramAsTextDocument";
import { DebouncedLatestTask } from "../utils/DebouncedLatestTask";

interface TrackedDiagramTextDocument {
	updateQueue: DebouncedLatestTask<string>;
}

export class EditDiagramAsTextFeature {
	public readonly dispose = Disposable.fn();
	private readonly drawioFsController = this.dispose.track(
		new DrawioFileSystemController()
	);

	private readonly trackedDocuments = new Map<
		TextDocument,
		TrackedDiagramTextDocument
	>();

	constructor(private readonly editorManager: DrawioEditorService) {
		this.dispose.track({
			dispose: () => {
				for (const tracked of this.trackedDocuments.values()) {
					tracked.updateQueue.dispose();
				}
				this.trackedDocuments.clear();
			},
		});

		this.dispose.track([
			workspace.onDidChangeTextDocument((e) => {
				const tracked = this.trackedDocuments.get(e.document);
				if (!tracked) {
					return;
				}
				tracked.updateQueue.enqueue(e.document.getText());
			}),
			workspace.onDidCloseTextDocument((e) => {
				this.trackedDocuments.get(e)?.updateQueue.dispose();
				this.trackedDocuments.delete(e);
			}),
		]);

		let isUpdating = false;

		this.dispose.track(
			registerFailableCommand(
				"hediet.vscode-drawio.editDiagramAsText",
				async () => {
					const activeDrawioEditor =
						this.editorManager.activeDrawioEditor;
					if (!activeDrawioEditor) {
						return;
					}

					const { didFileExist, file } =
						this.drawioFsController.getOrCreateFileForUri(
							activeDrawioEditor.uri.with({
								scheme: this.drawioFsController.scheme,
								path:
									activeDrawioEditor.uri.path + ".drawio-txt",
							})
						);

					const updateFile = async () => {
						const nodes =
							await activeDrawioEditor.drawioClient.getVertices();
						isUpdating = true;
						try {
							const doc = new DiagramAsTextDocument(nodes, []);
							file.writeString(doc.toString());
						} finally {
							isUpdating = false;
						}
					};

					await updateFile();

					if (!didFileExist) {
						this.dispose.track(
							file.onDidChangeFile(async () => {
								if (isUpdating) {
									return;
								}
								const doc = DiagramAsTextDocument.parse(
									file.readString()
								);
								doc.removeDuplicates();
								activeDrawioEditor.drawioClient.addVertices(
									doc.newVertices
								);
								await updateFile();
							})
						);
					}

					const doc = await workspace.openTextDocument(file.uri);
					this.trackedDocuments.get(doc)?.updateQueue.dispose();
					this.trackedDocuments.set(doc, {
						updateQueue: new DebouncedLatestTask(async (text) => {
							const parsed = DiagramAsTextDocument.parse(text);
							activeDrawioEditor.drawioClient.updateVertices(
								parsed.vertexUpdates
							);
						}, 100),
					});
					await window.showTextDocument(doc, {
						viewColumn: ViewColumn.Beside,
					});
				}
			)
		);
	}
}
