import { App, Modal, Notice, Setting } from "obsidian";
import { QuestionTemplate } from "../../core/types/QuestionAttributeTemplate";
import SecondBrainPlugin from "../../main";

export class CreateQuestionModal extends Modal {
	private selectedTemplate?: QuestionTemplate;
	private attrsContainer!: HTMLElement;
	private footerContainer!: HTMLElement;

	private questionText = "";
	private answerText = "";

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

		this.renderQAFields(contentEl);
		this.attrsContainer = contentEl.createDiv({
			cls: "template-attrs-container",
		});

		if (templates.length > 0) {
			this.selectedTemplate = templates[0];
			this.renderAttributes(contentEl);
		}

		this.footerContainer = contentEl.createDiv();
		this.renderFooter(this.footerContainer);
	}

	private renderFooter(container: HTMLElement) {
		const footer = container.createDiv({ cls: "question-modal-footer" });

		const cancelBtn = footer.createEl("button", {
			text: "Cancel",
			cls: "mod-secondary",
		});

		cancelBtn.onclick = () => this.close();

		const submitBtn = footer.createEl("button", {
			text: "Create",
			cls: "mod-cta",
		});

		submitBtn.onclick = () => this.handleSubmit();
	}

	private handleSubmit() {
		if (!this.questionText.trim()) {
			new Notice("Question cannot be empty");
			return;
		}

		// Later:
		// - build markdown
		// - create file
		// - insert into vault

		console.log({
			question: this.questionText,
			answer: this.answerText,
			template: this.selectedTemplate,
		});

		this.close();
	}

	private renderQAFields(container: HTMLElement) {
		const qaEl = container.createDiv({ cls: "question-qa" });

		// Question
		qaEl.createEl("label", {
			text: "Question",
			cls: "qa-label",
		});

		const questionArea = qaEl.createEl("textarea", {
			cls: "qa-textarea",
			attr: {
				placeholder: "Enter the question…",
				rows: "3",
			},
		});

		questionArea.addEventListener("input", () => {
			this.questionText = questionArea.value;
		});

		// Answer
		qaEl.createEl("label", {
			text: "Answer",
			cls: "qa-label qa-label-answer",
		});

		const answerArea = qaEl.createEl("textarea", {
			cls: "qa-textarea",
			attr: {
				placeholder: "Enter the answer…",
				rows: "4",
			},
		});

		qaEl.createEl("hr", { cls: "qa-divider" });

		answerArea.addEventListener("input", () => {
			this.answerText = answerArea.value;
		});
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
		//container.querySelector(".template-attrs")?.remove();
		this.attrsContainer.empty();

		if (!this.selectedTemplate) return;

		//const attrsEl = container.createDiv({ cls: "template-attrs" });
		const attrsEl = this.attrsContainer.createDiv({
			cls: "template-attrs",
		});

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
