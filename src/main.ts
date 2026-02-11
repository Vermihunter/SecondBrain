/* eslint-disable obsidianmd/ui/sentence-case */
import { Plugin, TFile } from "obsidian";
import { CreateQuestionModal } from "./ui/modals/CreateQuestionModal";
import {
	DEFAULT_SETTINGS,
	SecondBrainPluginSettings,
	SecondBrainSettingTab,
} from "./settings";
import { QuestionAttributeTemplateService } from "core/services/QuestionAttributeTemplateService";
import { GenerateQuestionsModal } from "ui/modals/GenerateQuestionsModal";
import GenerateQuestionsState from "core/types/GenerateQuestionsState";
import { generateQuestions } from "core/services/QuestionGeneratingService";
import {
	createFileFromPath,
	frontmatterToString,
	getQuestionFilePathForNote,
} from "core/services/FileService";
import { render_template } from "core/services/TemplatingService";
import DefaultQuestionTemplate from "core/default_templates/DefaultQuestionTemplate";

// Remember to rename these classes and interfaces!

export default class SecondBrainPlugin extends Plugin {
	settings: SecondBrainPluginSettings;
	templateService: QuestionAttributeTemplateService;

	async onload() {
		await this.loadSettings();

		this.templateService = new QuestionAttributeTemplateService(
			this.app,
			this.settings.questionTemplateFolder,
		);

		await this.templateService.load();

		// 🔥 vault listeners
		this.registerEvent(
			this.app.vault.on("create", async (file) => {
				if (file instanceof TFile) {
					await this.templateService.upsert(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (file instanceof TFile) {
					await this.templateService.upsert(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile) {
					this.templateService.remove(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("rename", async (file, oldPath) => {
				if (!(file instanceof TFile)) return;

				// remove old entry
				this.templateService.remove({ path: oldPath } as TFile);

				// add new one (if still in folder)
				await this.templateService.upsert(file);
			}),
		);

		this.addCommand({
			id: "create-question",
			name: "Create Question",
			callback: () => {
				new CreateQuestionModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: "generate-random-questions",
			name: "Generate Random Questions",
			callback: () => {
				new GenerateQuestionsModal(
					this.app,
					async (state: GenerateQuestionsState) => {
						const generatedQuestions = await generateQuestions(
							this.app,
							this,
							state,
						);

						console.log("generatedQuestions");
						console.log(generatedQuestions);

						const serializedQuestions = generatedQuestions
							.map((q) => {
								return render_template(
									DefaultQuestionTemplate,
									q,
								);
							})
							.join("\n");

						const header = frontmatterToString({
							tags: generatedQuestions
								.map((q) => q.tags)
								.flat()
								.unique(),
							properties: {},
						});

						const filePath = `${this.settings.generatedQuestionsDir}/${Date.now()}.md`;
						const fileContent = [header, serializedQuestions].join(
							"\n\n",
						);

						await createFileFromPath(
							this.app,
							filePath,
							fileContent,
						);

						return generatedQuestions;
					},
				).open();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SecondBrainSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<SecondBrainPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
