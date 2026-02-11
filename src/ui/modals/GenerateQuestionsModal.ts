import {
	App,
	Modal,
	Setting,
	TextComponent,
	ButtonComponent,
	Notice,
} from "obsidian";

import GenerateQuestionsState from "../../core/types/GenerateQuestionsState";
import Question from "core/types/Question";

export class GenerateQuestionsModal extends Modal {
	private state: GenerateQuestionsState = {
		seed: "",
		count: null,
		tags: [],
		properties: {},
	};

	private submitBtn!: ButtonComponent;
	private errorEl!: HTMLElement;

	constructor(
		app: App,
		private readonly onSubmit: (
			state: GenerateQuestionsState,
		) => Promise<Question[]>,
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		/* ---------- Title ---------- */
		contentEl.createEl("h2", {
			text: "Generate Questions",
			cls: "gq-title",
		});

		/* ---------- Error area (create early!) ---------- */
		this.errorEl = contentEl.createDiv({ cls: "gq-error" });

		/* ---------------- Seed ---------------- */
		new Setting(contentEl)
			.setName("Seed")
			.setDesc("Any value usable as a shuffle seed")
			.addText((text) => {
				text.onChange((v) => {
					this.state.seed = v;
					this.validate();
				});
			});

		/* ---------------- Count ---------------- */
		new Setting(contentEl)
			.setName("Number of questions")
			.setDesc("Positive integer")
			.addText((text: TextComponent) => {
				text.setPlaceholder("e.g. 10");

				const handler = () => {
					const raw = text.inputEl.value;
					const sanitized = raw.replace(/[^\d]/g, "");

					if (raw !== sanitized) {
						text.inputEl.value = sanitized;
					}

					if (!sanitized) {
						this.state.count = null;
						this.validate();
						return;
					}

					let n = Number(sanitized);
					n = Math.max(1, Math.min(100, n)); // clamp

					text.inputEl.value = String(n);
					this.state.count = n;
					this.validate();
				};

				text.inputEl.addEventListener("input", handler);

				// Clean up manually (Modal ≠ Component)
				this.onClose = ((orig) => () => {
					text.inputEl.removeEventListener("input", handler);
					orig?.();
				})(this.onClose);
			});

		/* ---------------- Tags ---------------- */
		contentEl.createEl("h3", { text: "Tags" });

		const tagsWrap = contentEl.createDiv({ cls: "gq-tags" });

		const renderTags = () => {
			tagsWrap.empty();
			this.state.tags.forEach((tag) => {
				const pill = tagsWrap.createSpan({
					cls: "gq-tag",
					text: `#${tag}`,
				});
				pill.onclick = () => {
					this.state.tags = this.state.tags.filter((t) => t !== tag);
					renderTags();
				};
			});
		};

		new Setting(contentEl)
			.setDesc("Press Enter to add a tag")
			.addText((text) => {
				text.setPlaceholder("tag-name");

				const handler = (e: KeyboardEvent) => {
					if (e.key !== "Enter") return;

					e.preventDefault();
					const value = text.getValue().trim();
					if (!value) return;

					if (!this.state.tags.includes(value)) {
						this.state.tags.push(value);
						renderTags();
					}

					text.setValue("");
				};

				text.inputEl.addEventListener("keydown", handler);

				this.onClose = ((orig) => () => {
					text.inputEl.removeEventListener("keydown", handler);
					orig?.();
				})(this.onClose);
			});

		renderTags();

		/* ---------------- Properties ---------------- */
		contentEl.createEl("h3", { text: "Properties" });

		const propsWrap = contentEl.createDiv({ cls: "gq-props" });

		const renderProps = () => {
			propsWrap.empty();

			Object.entries(this.state.properties).forEach(([key, value]) => {
				const row = propsWrap.createDiv({ cls: "gq-prop-row" });

				row.createSpan({ text: key, cls: "gq-prop-key" });
				row.createSpan({ text: value, cls: "gq-prop-value" });

				row.createSpan({
					text: "✕",
					cls: "gq-prop-remove",
				}).onclick = () => {
					delete this.state.properties[key];
					renderProps();
				};
			});
		};

		new Setting(contentEl).setName("Add property").addText((text) => {
			text.setPlaceholder("key=value");

			const handler = (e: KeyboardEvent) => {
				if (e.key !== "Enter") return;

				e.preventDefault();
				const raw = text.getValue();
				const idx = raw.indexOf("=");

				if (idx === -1) return;

				const key = raw.slice(0, idx).trim();
				const value = raw.slice(idx + 1).trim();

				if (!key) return;

				this.state.properties[key] = value;
				text.setValue("");
				renderProps();
			};

			text.inputEl.addEventListener("keydown", handler);

			this.onClose = ((orig) => () => {
				text.inputEl.removeEventListener("keydown", handler);
				orig?.();
			})(this.onClose);
		});

		renderProps();

		/* ---------------- Footer ---------------- */
		const footer = contentEl.createDiv({ cls: "gq-footer" });

		new ButtonComponent(footer)
			.setButtonText("Cancel")
			.onClick(() => this.close());

		this.submitBtn = new ButtonComponent(footer)
			.setButtonText("Generate")
			.setCta()
			.setDisabled(true)
			.onClick(() => this.submit());
	}

	private validate() {
		if (!this.submitBtn || !this.errorEl) return;

		if (!this.state.count) {
			this.errorEl.setText("Number of questions is required");
			this.submitBtn.setDisabled(true);
			return;
		}

		this.errorEl.empty();
		this.submitBtn.setDisabled(false);
	}

	private async submit() {
		// console.log(`submit state`);
		// console.log(this.state);
		await this.onSubmit({ ...this.state });
		new Notice("Questions generated");
		this.close();
	}
}
