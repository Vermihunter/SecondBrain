import { App, PluginSettingTab, Setting } from "obsidian";
import SecondBrainPlugin from "./main";

export interface SecondBrainPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: SecondBrainPluginSettings = {
	mySetting: "default",
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

		new Setting(containerEl)
			.setName("Settings #1")
			.setDesc("It's a secretttttttt")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
