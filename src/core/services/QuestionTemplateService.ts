import { App, TFile, parseYaml } from "obsidian";
import { QuestionTemplate } from "../types/QuestionAttributeTemplate";

export class QuestionTemplateService {
	private cache = new Map<string, QuestionTemplate>();

	constructor(
		private app: App,
		private folder: string,
	) {}

	async load(): Promise<void> {
		this.cache.clear();

		if (!this.folder) return;

		const files = this.app.vault
			.getMarkdownFiles()
			.filter((f) => f.path.startsWith(this.folder));

		for (const file of files) {
			await this.upsert(file);
		}
	}

	async upsert(file: TFile) {
		if (!this.isTemplateFile(file)) return;

		const template = await this.parseTemplate(file);
		if (template) {
			this.cache.set(template.id, template);
		}
	}

	// 🔹 remove from cache
	remove(file: TFile) {
		this.cache.delete(file.path);
	}

	private isTemplateFile(file: TFile): boolean {
		return file.extension === "md" && file.path.startsWith(this.folder);
	}

	async reload() {
		await this.load();
	}

	getAll(): QuestionTemplate[] {
		return [...this.cache.values()];
	}

	get(id: string): QuestionTemplate | undefined {
		return this.cache.get(id);
	}

	private async parseTemplate(file: TFile): Promise<QuestionTemplate | null> {
		const content = await this.app.vault.read(file);
		const match = content.match(/^---\n([\s\S]*?)\n---/);

		if (!match) return null;

		const data = parseYaml(match[1]);

		if (!data?.attributes || !data?.name) return null;

		return {
			id: file.path,
			name: data.name,
			attributes: data.attributes,
		};
	}
}
