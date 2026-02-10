import { App, PluginSettingTab, Setting } from "obsidian";
import SecondBrainPlugin from "./main";
import { FolderSuggest } from "core/utils/suggesters/FolderSuggester";

export interface SecondBrainPluginSettings {
	mySetting: string;
	questionTemplateFolder: string;
}

export const DEFAULT_SETTINGS: SecondBrainPluginSettings = {
	mySetting: "default",
	questionTemplateFolder: "/",
};

export class SecondBrainSettingTab extends PluginSettingTab {
	plugin: SecondBrainPlugin;

	constructor(app: App, plugin: SecondBrainPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Question Templates" });

		new Setting(this.containerEl)
			.setName("Question Template folder location")
			.setDesc("Folder containing question attribute templates")
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("Example: folder1/folder2")
					.setValue(this.plugin.settings.questionTemplateFolder)
					.onChange(async (new_folder) => {
						// Trim folder and Strip ending slash if there
						new_folder = new_folder.trim();
						new_folder = new_folder.replace(/\/$/, "");

						this.plugin.settings.questionTemplateFolder =
							new_folder;
						await this.plugin.saveSettings();
						await this.plugin.templateService.reload();

						//	this.plugin.settings.templates_folder = new_folder;
						//
					});
				// @ts-ignore
				cb.containerEl.addClass("templater_search");
			});
	}
}
