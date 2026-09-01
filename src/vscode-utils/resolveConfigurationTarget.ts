export interface ConfigurationInspection {
	workspaceFolderLanguageValue?: unknown;
	workspaceFolderValue?: unknown;
	workspaceLanguageValue?: unknown;
	workspaceValue?: unknown;
}

export type ResolvedConfigurationTarget =
	| "workspaceFolder"
	| "workspace"
	| "global";

export function resolveConfigurationTarget(
	inspection: ConfigurationInspection | undefined
): ResolvedConfigurationTarget {
	if (
		inspection &&
		[
			inspection.workspaceFolderLanguageValue,
			inspection.workspaceFolderValue,
		].some((value) => value !== undefined)
	) {
		return "workspaceFolder";
	}

	if (
		inspection &&
		[inspection.workspaceLanguageValue, inspection.workspaceValue].some(
			(value) => value !== undefined
		)
	) {
		return "workspace";
	}

	return "global";
}
