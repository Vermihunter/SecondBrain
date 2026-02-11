export default interface GenerateQuestionsState {
	seed: string;
	count: number | null;
	tags: string[];
	properties: Record<string, string>;
}
