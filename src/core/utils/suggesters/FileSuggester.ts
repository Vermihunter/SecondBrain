// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { TAbstractFile, TFile } from "obsidian";
import { TextInputSuggest } from "./suggest";
import { get_tfiles_from_folder } from "../Utils";
import TemplaterPlugin from "main";
import { errorWrapperSync } from "../Error";
import { SecondBrainPluginSettings } from "settings";

export class FileSuggest extends TextInputSuggest<TFile> {
	constructor(
		public inputEl: HTMLInputElement,
		private plugin: TemplaterPlugin,
		private folderKey: keyof SecondBrainPluginSettings,
		private sliceMin: number = 0,
		private sliceMax: number = 100,
		private errMsg: string,
	) {
		super(plugin.app, inputEl);
	}

	get_folder(): string {
		return this.plugin.settings[this.folderKey];
	}

	get_error_msg(): string {
		return this.errMsg;
	}

	getSuggestions(input_str: string): TFile[] {
		const all_files = errorWrapperSync(
			() => get_tfiles_from_folder(this.plugin.app, this.get_folder()),
			this.get_error_msg(),
		);
		if (!all_files) {
			return [];
		}

		const files: TFile[] = [];
		const lower_input_str = input_str.toLowerCase();

		all_files.forEach((file: TAbstractFile) => {
			if (
				file instanceof TFile &&
				file.extension === "md" &&
				file.path.toLowerCase().contains(lower_input_str)
			) {
				files.push(file);
			}
		});

		return files.slice(this.sliceMin, this.sliceMax);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
