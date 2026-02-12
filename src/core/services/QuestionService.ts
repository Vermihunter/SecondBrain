import Question from "core/types/Question";
//import QuestionProperty from "core/types/QuestionProperty";
import { get_tfiles_from_folder } from "core/utils/Utils";
import SecondBrainPlugin from "main";
import { App, TFile } from "obsidian";
import { getFileTags } from "./FileService";
import QuestionGeneratingType from "core/types/QuestionGeneratingInformation";
import { PropertySchemaMap } from "core/types/PropertySchema";

export async function getAllQuestions(
	app: App,
	plugin: SecondBrainPlugin,
	baseFolder: string,
): Promise<Question[]> {
	const allQuestionFolders: Array<TFile> = get_tfiles_from_folder(
		app,
		baseFolder, // plugin.settings.questionsBaseDir,
	);

	const questions: Question[] = [];
	for (const file of allQuestionFolders) {
		// Skip generated questions - they have the same format so they would be duplicated many times
		if (file.path.startsWith(plugin.settings.generatedQuestionsDir)) {
			continue;
		}

		// Parse the blocks (= questions) from a single file since there may be multiple in a single file
		const content = await app.vault.read(file);
		const blocks = parseQuestions(content);

		// Construct Question objects from
		for (const block of blocks) {
			questions.push({
				question: block.question,
				answer: block.answer,
				attributes: block.attributes,
				tags: getFileTags(app, file),
			});
		}
	}
	return questions;
}

interface ParseResult {
	question: string;
	answer: string;
	attributes: QuestionGeneratingType[];
}

function parseQuestions(src: string): ParseResult[] {
	const results: ParseResult[] = [];

	// Split by question blocks
	const blocks = src.split(/(?=> \[!question\])/g).filter((b) => b.trim());

	for (const block of blocks) {
		const questionMatch = block.match(/> \[!question\] (.*)/);
		const answerMatch = block.match(
			/> > \[!answer\]- Answer\s*(?:\s*> > (.*))/s,
		);

		// This regex looks for: key="..." value="..." class="..." and the inner text
		// We use the 'g' flag to find all spans within the meta section
		const attrRegex =
			/<span\s+key="(?<key>[^"]+)"\s+value="(?<val>[^"]+)"\s+class="(?<cssClass>[^"]+)"\s*>(?<label>[^<]+)<\/span>/g;

		const attributes: QuestionGeneratingType[] = [];
		let match;

		while ((match = attrRegex.exec(block)) !== null) {
			const groups = match.groups as {
				key: string;
				val: string;
				cssClass: string;
				label: string;
			};

			let finalVal: string | number | boolean = groups.val;

			// Type casting logic
			if (finalVal.toLowerCase() === "true") finalVal = true;
			else if (finalVal.toLowerCase() === "false") finalVal = false;
			else if (!isNaN(Number(finalVal)) && finalVal !== "")
				finalVal = Number(finalVal);

			attributes.push({
				key: groups.key,
				label: groups.label.trim(),
				val: finalVal,
				cssClass: groups.cssClass,
			});
		}

		if (questionMatch && answerMatch) {
			results.push({
				question: questionMatch[1].trim(),
				answer: answerMatch[1].trim().replace(/\s*> > /g, "\n"),
				attributes,
			});
		}
	}

	return results;
}

function parseQuestions_old(src: string) {
	const results: {
		question: string;
		answer: string;
		attributes: QuestionProperty[];
	}[] = [];

	// 1. Split by the start of a question block to handle multiple entries
	const blocks = src
		.split(/(?=> \[!question\])/g)
		.filter((block) => block.trim());

	for (const block of blocks) {
		// Regex for Question: Matches text immediately after [!question]
		const questionMatch = block.match(/> \[!question\] (.*)/);

		// Regex for Answer: Matches text after the [!answer] line until the end of the block
		// Uses the 's' flag (dotAll) to capture multi-line answers if they exist
		const answerMatch = block.match(
			/> > \[!answer\]- Answer\s*(?:\s*> > (.*))/s,
		);

		// Regex for Attributes: Global match for the span data and inner text
		const attrRegex = /<span data="([^"]+)"[^>]*>([^<]+)<\/span>/g;
		const attributes: QuestionProperty[] = [];

		let match;
		while ((match = attrRegex.exec(block)) !== null) {
			const name = match[1];
			let value: string | number | boolean = match[2].trim();

			// Logic to handle boolean/number conversions if "reviewed" or "bool" is in the class or name
			// if (value.toLowerCase() === "true") value = true;
			// if (value.toLowerCase() === "false") value = false;
			if (!isNaN(Number(value)) && value !== "") value = Number(value);

			attributes.push({ name, value });
		}

		if (questionMatch && answerMatch) {
			results.push({
				question: questionMatch[1].trim(),
				answer: answerMatch[1].trim().replace(/\s*> > /g, "\n"), // Clean up nested quote prefixes
				attributes,
			});
		}
	}

	return results;
}

export function questionsToPropertySchema(
	questions: Question[],
): PropertySchemaMap {
	const map: Record<string, Set<string | number | boolean>> = {};

	// 1️⃣ Collect all values per key
	for (const q of questions) {
		for (const attr of q.attributes) {
			if (!map[attr.key]) {
				map[attr.key] = new Set();
			}
			map[attr.key].add(attr.val);
		}
	}

	const schema: PropertySchemaMap = {};

	// 2️⃣ Infer type per key
	for (const [key, values] of Object.entries(map)) {
		const uniqueValues = Array.from(values);

		// If all values are boolean → boolean type
		if (uniqueValues.every((v) => typeof v === "boolean")) {
			schema[key] = { type: "boolean" };
		} else {
			// Otherwise → select
			schema[key] = {
				type: "select",
				options: uniqueValues.filter(
					(v): v is string | number =>
						typeof v === "string" || typeof v === "number",
				),
			};
		}
	}

	return schema;
}

// const propertySchema: PropertySchemaMap = {
// 	difficulty: { type: "select", options: ["easy", "medium", "hard"] },
// 	favorite: { type: "boolean" },
// 	points: { type: "select", options: [1, 2, 3, 5] },
// };
