/* eslint-disable obsidianmd/ui/sentence-case */
/* eslint-disable obsidianmd/settings-tab/no-manual-html-headings */
import { App, PluginSettingTab, Setting } from "obsidian";
import SecondBrainPlugin from "./main";
import { FolderSuggest } from "core/utils/suggesters/FolderSuggester";
import { FileSuggest } from "core/utils/suggesters/FileSuggester";

export interface SecondBrainPluginSettings {
	questionTemplateFolder: string;
	//questionObsidianTemplateFile: string;
	questionsBaseDir: string;
	generatedQuestionsDir: string;
}

export const DEFAULT_SETTINGS: SecondBrainPluginSettings = {
	questionTemplateFolder: "/",
	//questionObsidianTemplateFile: "",
	questionsBaseDir: "Questions",
	generatedQuestionsDir: "Generated",
};

export class SecondBrainSettingTab extends PluginSettingTab {
	plugin: SecondBrainPlugin;

	constructor(app: App, plugin: SecondBrainPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private addQuestionsBaseDirInput() {
		new Setting(this.containerEl)
			.setName("Question Folder location")
			.setDesc("Folder containing questions")
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("Example: folder1/folder2")
					.setValue(this.plugin.settings.questionsBaseDir)
					.onChange(async (new_folder) => {
						// Trim folder and Strip ending slash if there
						new_folder = new_folder.trim();
						new_folder = new_folder.replace(/\/$/, "");

						this.plugin.settings.questionsBaseDir = new_folder;
						await this.plugin.saveSettings();
					});
				// @ts-ignore
				cb.containerEl.addClass("templater_search");
			});
	}

	private addQuestionAttributeTemplateFolderInput() {
		new Setting(this.containerEl)
			.setName("Question Attribute Template folder location")
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
					});
				// @ts-ignore
				cb.containerEl.addClass("templater_search");
			});
	}

	private addGeneratedQuestionsFolderInput() {
		new Setting(this.containerEl)
			.setName("Generated Questions folder location")
			.setDesc("Folder containing generated questions")
			.addSearch((cb) => {
				new FolderSuggest(
					this.app,
					cb.inputEl,
					this.plugin.settings.questionsBaseDir,
				);
				cb.setPlaceholder("Example: folder1/folder2")
					.setValue(this.plugin.settings.generatedQuestionsDir)
					.onChange(async (new_folder) => {
						// Trim folder and Strip ending slash if there
						new_folder = new_folder.trim();
						new_folder = new_folder.replace(/\/$/, "");

						this.plugin.settings.generatedQuestionsDir = new_folder;
						await this.plugin.saveSettings();
					});
				// @ts-ignore
				cb.containerEl.addClass("templater_search");
			});
	}

	// private addQuestionTemplateFolderInput() {
	// 	new Setting(this.containerEl)
	// 		.setName("Question Template File location")
	// 		.setDesc("Folder containing question templates")
	// 		.addSearch((cb) => {
	// 			new FileSuggest(
	// 				cb.inputEl,
	// 				this.plugin,
	// 				"questionObsidianTemplateFile",
	// 				0,
	// 				100,
	// 				"No such file found",
	// 			);
	// 			cb.setPlaceholder("Example: folder1/folder2/template_file")
	// 				.setValue(this.plugin.settings.questionObsidianTemplateFile)
	// 				.onChange(async (new_template) => {
	// 					this.plugin.settings.questionObsidianTemplateFile =
	// 						new_template.trim().replace(/\/$/, "");
	// 					await this.plugin.saveSettings();
	// 				});
	// 			// @ts-ignore
	// 			cb.containerEl.addClass("templater_search");
	// 		});
	// }

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Question Templates" });
		this.addQuestionAttributeTemplateFolderInput();
		//this.addQuestionTemplateFolderInput();
		this.addQuestionsBaseDirInput();
		this.addGeneratedQuestionsFolderInput();
	}
}
