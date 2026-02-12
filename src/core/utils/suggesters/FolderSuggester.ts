// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";

export class FolderSuggest extends TextInputSuggest<TFolder> {
	// Added rootPath to the constructor
	constructor(
		app: App,
		inputEl: HTMLInputElement | HTMLTextAreaElement,
		private rootPath: string = "/",
	) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): TFolder[] {
		const abstractFiles: TAbstractFile[] =
			this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		// Ensure rootPath ends with a slash for clean matching, unless it's the root
		const normalizedRoot =
			this.rootPath.endsWith("/") || this.rootPath === ""
				? this.rootPath
				: this.rootPath + "/";

		abstractFiles.forEach((file: TAbstractFile) => {
			if (file instanceof TFolder) {
				const isInsideRoot =
					file.path.startsWith(normalizedRoot) ||
					normalizedRoot === "/";
				const matchesInput = file.path
					.toLowerCase()
					.contains(lowerCaseInputStr);

				if (isInsideRoot && matchesInput) {
					folders.push(file);
				}
			}
		});

		return folders.slice(0, 1000);
	}

	renderSuggestion(file: TFolder, el: HTMLElement): void {
		let displayPath = file.path;

		// If we are restricted to a rootPath, let's make the UI cleaner
		if (this.rootPath && this.rootPath !== "/") {
			// Remove the rootPath prefix from the display
			if (displayPath.startsWith(this.rootPath)) {
				displayPath = displayPath.substring(this.rootPath.length);
			}
		}

		// Clean up leading slashes so we don't get "//folder"
		displayPath = displayPath.startsWith("/")
			? displayPath.substring(1)
			: displayPath;

		// If the path is empty (meaning it IS the root), show a slash
		el.setText(displayPath || "/");
	}

	selectSuggestion(file: TFolder): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
