import FrontmatterData from "core/types/FrontmatterData";
import SecondBrainPlugin from "main";
import { App, TFile, normalizePath } from "obsidian";

/**
 * Creates all the folders recursively that are part of the folderPath parameter
 * @param app
 * @param folderPath
 */
async function ensureFolderExists(app: App, folderPath: string) {
	const parts = folderPath.split("/");
	let current = "";

	for (const part of parts) {
		current = current ? `${current}/${part}` : part;

		const existing = app.vault.getAbstractFileByPath(current);
		if (!existing) {
			await app.vault.createFolder(current);
		}
	}
}

function getFolderOfFile(filePath: string) {
	return filePath.split("/").slice(0, -1).join("/");
}

/**
 * Returns a file at a given path - If the file does not exists, creates it
 * @param filePath
 * @param fileContent
 * @param app
 * @returns
 */
export async function createFileIfNotExists(
	app: App,
	filePath: string,
	fileContent: string,
): Promise<TFile> {
	let targetFile: TFile | null = app.vault.getFileByPath(filePath);

	if (!targetFile) {
		targetFile = await createFileFromPath(app, filePath, fileContent);
	}

	return targetFile;
}

export async function createFileFromPath(
	app: App,
	filePath: string,
	fileContent: string,
) {
	await ensureFolderExists(app, getFolderOfFile(filePath));
	return await app.vault.create(filePath, fileContent);
}

export function getQuestionFilePathForNote(
	plugin: SecondBrainPlugin,
	file: TFile,
) {
	const folder = getFolderOfFile(file.path);
	return normalizePath(
		`${plugin.settings.questionsBaseDir}/${folder}/${file.basename}.${file.extension}`,
	);
}

export function getFileTags(app: App, file: TFile): string[] {
	const cache = app.metadataCache.getFileCache(file);

	if (!cache) return [];

	const tags = new Set<string>();

	// Inline tags
	cache.tags?.forEach((t) => {
		tags.add(t.tag.replace(/^#/, ""));
	});

	// Frontmatter tags
	const fmTags = cache.frontmatter?.tags;
	if (Array.isArray(fmTags)) {
		fmTags.forEach((t) => tags.add(String(t)));
	} else if (typeof fmTags === "string") {
		tags.add(fmTags);
	}

	return [...tags];
}

export function frontmatterToString(data: FrontmatterData): string {
	const lines: string[] = [];

	lines.push("---");

	if (data.tags && data.tags.length > 0) {
		lines.push("tags:");
		for (const tag of data.tags) {
			lines.push(`  - ${tag}`);
		}
	}

	if (data.properties) {
		for (const [key, value] of Object.entries(data.properties)) {
			if (value === undefined) continue;

			if (Array.isArray(value)) {
				lines.push(`${key}:`);
				for (const v of value) {
					lines.push(`  - ${String(v)}`);
				}
			} else {
				lines.push(`${key}: ${String(value)}`);
			}
		}
	}

	lines.push("---");

	return lines.join("\n");
}
