import { App, TFile, parseYaml } from "obsidian";
import { QuestionAttributeTemplate } from "../types/QuestionAttributeTemplate";

/**
 * A service to load/unload question attribute templates into a cache
 * - These templates are used
 */
export class QuestionAttributeTemplateService {
	private cache = new Map<string, QuestionAttributeTemplate>();

	constructor(
		private app: App,
		private folder: string,
	) {}

	async load(): Promise<void> {
		this.cache.clear();

		if (!this.folder) return;

		const files = this.app.vault
			.getFiles()
			.filter((f) => f.path.startsWith(this.folder));

		for (const file of files) {
			await this.upsert(file);
		}
	}

	async upsert(file: TFile) {
		if (!this.isTemplateFile(file)) return;

		const template: QuestionAttributeTemplate | null =
			await this.parseTemplate(file);
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
		// console.log(
		// 	`Loaded templates: ${Array.from(this.cache.keys()).join(",")}`,
		// );
	}

	getAll(): QuestionAttributeTemplate[] {
		return [...this.cache.values()];
	}

	get(id: string): QuestionAttributeTemplate | undefined {
		return this.cache.get(id);
	}

	private async parseTemplate(
		file: TFile,
	): Promise<QuestionAttributeTemplate | null> {
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
