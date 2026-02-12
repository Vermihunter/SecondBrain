import GenerateQuestionsState from "core/types/GenerateQuestionsState";
import { getAllQuestions } from "./QuestionService";
import { App, TFile } from "obsidian";
import SecondBrainPlugin from "main";
import Question from "core/types/Question";
import { shuffleSeeded } from "core/utils/Random";
import { render_template } from "./TemplatingService";
import DefaultQuestionTemplate from "core/default_templates/DefaultQuestionTemplate";
import {
	createFileFromPath,
	frontmatterToString,
	getFileTags,
	getQuestionFilePathForNote,
} from "./FileService";

export async function generateQuestions(
	app: App,
	plugin: SecondBrainPlugin,
	state: GenerateQuestionsState,
	allQuestions: Question[],
): Promise<Question[]> {
	// const allQuestions = await getAllQuestions(
	// 	app,
	// 	plugin,
	// 	plugin.settings.questionsBaseDir,
	// );

	// console.log("state");
	// console.log(state);

	// console.log("all questions");
	// console.log(allQuestions);

	let filtered = allQuestions.filter(
		(q) =>
			hasAllTags(q, state.tags) && matchesProperties(q, state.properties),
	);

	// console.log("filtered questions");
	// console.log(filtered);

	const shuffled = shuffleSeeded(filtered, state.seed);
	return state.count == null ? shuffled : shuffled.slice(0, state.count);
}

function matchesProperties(
	q: Question,
	required: Record<string, string>,
): boolean {
	const entries = Object.entries(required);
	if (entries.length === 0) return true;

	return entries.every(([key, value]) =>
		q.attributes.some(
			(attr) => attr.key === key && String(attr.val) === value,
		),
	);
}

function hasAllTags(q: Question, requiredTags: string[]) {
	if (!requiredTags || requiredTags.length === 0) return true;
	return requiredTags.every((tag) => q.tags.includes(tag));
}

export async function createQuestion(
	app: App,
	plugin: SecondBrainPlugin,
	q: Question,
	sourceFile: TFile,
) {
	// Rendering the question into the defined format
	const question = render_template(DefaultQuestionTemplate, {
		question: q.question,
		answer: q.answer
			.split("\n")
			.map((t) => `> > ${t}`)
			.join("\n"),
		attributes: q.attributes,
	});

	// Append question to the question file
	await appendQuestionForFile(app, plugin, sourceFile, question);
}

async function appendQuestionForFile(
	app: App,
	plugin: SecondBrainPlugin,
	file: TFile,
	question: string,
) {
	const questionNotePath = getQuestionFilePathForNote(plugin, file);

	let questionNote: TFile | null = app.vault.getFileByPath(questionNotePath);

	if (!questionNote) {
		const sourceNoteTags = getFileTags(app, file);
		const serializedFrontmatter = frontmatterToString({
			tags: sourceNoteTags,
			properties: {},
		});

		const questionFileContent = [serializedFrontmatter, question].join(
			"\n",
		);
		console.log("creating");

		questionNote = await createFileFromPath(
			app,
			questionNotePath,
			questionFileContent,
		);
	} else {
		const current = await app.vault.read(questionNote);
		const separator = current.endsWith("\n") ? "" : "\n";

		console.log("appending");

		await app.vault.modify(questionNote, current + separator + question);
	}
}
