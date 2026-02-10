import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	TFile,
} from "obsidian";
import { CreateQuestionModal } from "./ui/modals/CreateQuestionModal";
import {
	DEFAULT_SETTINGS,
	SecondBrainPluginSettings,
	SecondBrainSettingTab,
} from "./settings";
import { QuestionTemplateService } from "core/services/QuestionTemplateService";

// Remember to rename these classes and interfaces!

export default class SecondBrainPlugin extends Plugin {
	settings: SecondBrainPluginSettings;
	templateService: QuestionTemplateService;

	async onload() {
		await this.loadSettings();

		this.templateService = new QuestionTemplateService(
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

		// This creates an icon in the left ribbon.
		this.addRibbonIcon("dice", "Sample", (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice("This is a notice!");
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status bar text");

		this.addCommand({
			id: "display-modal",
			name: "Display modal",
			callback: () => {
				new CreateQuestionModal(this.app, this).open();
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
