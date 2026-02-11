import { App, Modal, Notice, Setting, TFile, ToggleComponent } from "obsidian";
import { QuestionAttributeTemplate } from "../../core/types/QuestionAttributeTemplate";
import SecondBrainPlugin from "../../main";
import { buildCssClass } from "core/utils/Utils";
import Question from "core/types/Question";
import { createQuestion } from "core/services/QuestionGeneratingService";
import QuestionGeneratingType from "core/types/QuestionGeneratingInformation";

interface ModalInputData {
	//type: "string" | "number" | "boolean";
	name: string;
	value: string | number | boolean;
}

export class CreateQuestionModal extends Modal {
	private selectedTemplate?: QuestionAttributeTemplate;
	private attrsContainer!: HTMLElement;
	private footerContainer!: HTMLElement;
	private attrInputs = new Map<string, HTMLElement | ToggleComponent>();

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

		contentEl.createEl("h2", {
			text: "Create Question",
			cls: "centered-modal-title",
		});

		const templates: QuestionAttributeTemplate[] =
			this.renderTemplatePicker(contentEl);

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

	private getInputData() {
		const result: ModalInputData[] = [];

		for (const attr of this.selectedTemplate.attributes) {
			const el = this.attrInputs.get(attr.key);
			if (!el) continue;

			switch (attr.type) {
				case "checkbox":
					result.push({
						//type: "boolean",
						name: attr.key,
						value: (el as ToggleComponent).getValue(),
					});
					break;

				case "number":
					result.push({
						//type: "number",
						name: attr.key,
						value: Number((el as HTMLInputElement).value || 0),
					});
					break;

				case "text":
				case "select":
					result.push({
						//type: "string",
						name: attr.key,
						value: (el as HTMLInputElement).value,
					});
					break;
			}
		}

		return result;
	}

	private inputToQuestionGeneratingType = (
		i: ModalInputData,
	): QuestionGeneratingType => {
		const templateAttr = this.selectedTemplate?.attributes.find(
			(a) => a.key === i.name,
		);

		let value = i.value;
		let cssClass: string = "";
		if (typeof i.value === "boolean") {
			value = i.name;
			cssClass = i.value === true ? "bool-true" : "bool-false";
		} else {
			cssClass = buildCssClass(
				i.name,
				String(value),
				templateAttr?.cssMode ?? "key-value",
			);
		}

		return {
			key: i.name,
			val: i.value,
			label: String(value),
			cssClass,
		};
	};

	// This should not happen here → refactor to a service
	private async handleSubmit() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			new Notice("Please open a file to create questions for!");
			return;
		}

		if (!this.questionText.trim()) {
			new Notice("Question cannot be empty");
			return;
		}

		// Get input data from the Modal
		const inputData = this.getInputData();
		const attributes = inputData.map(this.inputToQuestionGeneratingType);

		const question: Question = {
			question: this.questionText,
			answer: this.answerText,
			attributes,
			tags: [], // appended in next step in createQuestion
		};

		await createQuestion(this.app, this.plugin, question, file);

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

	private renderTemplatePicker(
		container: HTMLElement,
	): QuestionAttributeTemplate[] {
		const templates = this.plugin.templateService.getAll();

		new Setting(container).setName("Template").addDropdown((dropdown) => {
			for (const t of templates) {
				dropdown.addOption(t.id, t.name);
			}

			dropdown.onChange((value) => {
				this.selectedTemplate = this.plugin.templateService.get(value);
				this.renderAttributes();
			});
		});

		return templates;
	}

	private renderAttributes() {
		//container.querySelector(".template-attrs")?.remove();
		this.attrsContainer.empty();
		this.attrInputs.clear();

		if (!this.selectedTemplate) return;

		//const attrsEl = container.createDiv({ cls: "template-attrs" });
		const attrsEl = this.attrsContainer.createDiv({
			cls: "template-attrs",
		});

		for (const attr of this.selectedTemplate.attributes) {
			const setting = new Setting(attrsEl).setName(attr.key);

			switch (attr.type) {
				case "text":
					setting.addText((t) => {
						this.attrInputs.set(attr.key, t.inputEl);
					});
					break;

				case "number":
					setting.addText((t) => {
						t.inputEl.type = "number";
						this.attrInputs.set(attr.key, t.inputEl);
					});
					break;

				case "checkbox":
					setting.addToggle((t) => {
						this.attrInputs.set(attr.key, t);
					});
					break;

				case "select":
					setting.addDropdown((d) => {
						attr.options?.forEach((opt) => d.addOption(opt, opt));
						this.attrInputs.set(attr.key, d.selectEl);
					});
					break;
			}
		}
	}
}
