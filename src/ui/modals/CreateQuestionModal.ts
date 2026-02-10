// import {
// 	App,
// 	Modal,
// 	Setting,
// 	TextComponent,
// 	DropdownComponent,
// 	ToggleComponent,
// 	ButtonComponent,
// 	Notice,
// } from "obsidian";

// type Mode = "auto" | "manual";

// interface CreateQuestionModalResult {
// 	retries: number;
// 	mode: Mode;
// 	verbose: boolean;
// }

// export class CreateQuestionModal extends Modal {
// 	private retries: number | null = null;
// 	private mode: Mode = "auto";
// 	private verbose = false;

// 	private saveButton!: ButtonComponent;
// 	private errorEl!: HTMLElement;

// 	constructor(
// 		app: App,
// 		private readonly onSubmit: (result: CreateQuestionModalResult) => void,
// 	) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.empty();

// 		contentEl.createEl("h2", {
// 			text: "Create Question",
// 			cls: "centered-modal-title",
// 		});

// 		/* ---------- Retries (integer input) ---------- */
// 		new Setting(contentEl)
// 			.setName("Retries")
// 			.setDesc("Integer between 1 and 10")
// 			.addText((text) => {
// 				text.setPlaceholder("1–10");

// 				text.onChange((value) => {
// 					// Remove everything except digits
// 					const sanitized = value.replace(/[^\d]/g, "");

// 					// If we changed it, write it back immediately
// 					if (value !== sanitized) {
// 						text.setValue(sanitized);
// 						return;
// 					}

// 					const n = Number(sanitized);
// 					this.retries = Number.isInteger(n) ? n : null;
// 					this.validate();
// 				});
// 			});

// 		/* ---------- Mode (enum dropdown) ---------- */
// 		new Setting(contentEl)
// 			.setName("Mode")
// 			.setDesc("Execution mode")
// 			.addDropdown((dropdown: DropdownComponent) => {
// 				dropdown
// 					.addOptions({
// 						auto: "Automatic",
// 						manual: "Manual",
// 					})
// 					.setValue(this.mode)
// 					.onChange((value: Mode) => {
// 						this.mode = value;
// 						this.validate();
// 					});
// 			});

// 		/* ---------- Verbose toggle ---------- */
// 		new Setting(contentEl)
// 			.setName("Verbose logging")
// 			.setDesc("Show extra debug information")
// 			.addToggle((toggle: ToggleComponent) => {
// 				toggle.setValue(this.verbose).onChange((value) => {
// 					this.verbose = value;
// 					this.validate();
// 				});
// 			});

// 		/* ---------- Validation error area ---------- */
// 		this.errorEl = contentEl.createEl("div", {
// 			cls: "example-modal-error",
// 		});

// 		/* ---------- Footer buttons ---------- */
// 		const footer = contentEl.createDiv({ cls: "modal-button-container" });

// 		new ButtonComponent(footer)
// 			.setButtonText("Cancel")
// 			.onClick(() => this.close());

// 		this.saveButton = new ButtonComponent(footer)
// 			.setButtonText("Save")
// 			.setCta()
// 			.setDisabled(true)
// 			.onClick(() => this.submit());
// 	}

// 	private validate() {
// 		if (this.retries === null) {
// 			this.setError("Retries must be an integer");
// 			return;
// 		}

// 		if (this.retries < 1 || this.retries > 10) {
// 			this.setError("Retries must be between 1 and 10");
// 			return;
// 		}

// 		this.clearError();
// 	}

// 	private setError(message: string) {
// 		this.errorEl.setText(message);
// 		this.saveButton.setDisabled(true);
// 	}

// 	private clearError() {
// 		this.errorEl.empty();
// 		this.saveButton.setDisabled(false);
// 	}

// 	private submit() {
// 		if (this.retries === null) return;

// 		this.onSubmit({
// 			retries: this.retries,
// 			mode: this.mode,
// 			verbose: this.verbose,
// 		});

// 		new Notice("Settings saved");
// 		this.close();
// 	}

// 	onClose() {
// 		this.contentEl.empty();
// 	}
// }

import { App, Modal, Setting } from "obsidian";
import { QuestionTemplate } from "../../core/types/QuestionAttributeTemplate";
import SecondBrainPlugin from "../../main";

export class CreateQuestionModal extends Modal {
	private selectedTemplate?: QuestionTemplate;

	constructor(
		app: App,
		private plugin: SecondBrainPlugin,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Create Question" });

		const templates = this.renderTemplatePicker(contentEl);
		if (templates.length > 0) {
			this.selectedTemplate = templates[0];
			this.renderAttributes(contentEl);
		}
	}

	private renderTemplatePicker(container: HTMLElement): QuestionTemplate[] {
		const templates = this.plugin.templateService.getAll();

		new Setting(container).setName("Template").addDropdown((dropdown) => {
			for (const t of templates) {
				dropdown.addOption(t.id, t.name);
			}

			dropdown.onChange((value) => {
				this.selectedTemplate = this.plugin.templateService.get(value);

				this.renderAttributes(container);
			});
		});

		return templates;
	}

	private renderAttributes(container: HTMLElement) {
		container.querySelector(".template-attrs")?.remove();

		if (!this.selectedTemplate) return;

		const attrsEl = container.createDiv({ cls: "template-attrs" });

		for (const attr of this.selectedTemplate.attributes) {
			const setting = new Setting(attrsEl).setName(attr.key);

			switch (attr.type) {
				case "text":
					setting.addText((t) => {});
					break;

				case "number":
					setting.addText((t) => (t.inputEl.type = "number"));
					break;

				case "checkbox":
					setting.addToggle((t) => {});
					break;

				case "select":
					setting.addDropdown((d) => {
						attr.options?.forEach((opt) => d.addOption(opt, opt));
					});
					break;
			}
		}
	}
}
