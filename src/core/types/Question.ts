import QuestionGeneratingType from "./QuestionGeneratingInformation";

/**
 * Represents one logical Question object - this should be the base
 * representation of the questions, if another format needed, there should be
 * a transformer from/to this format
 */
export default interface Question {
	question: string;
	answer: string;
	attributes: QuestionGeneratingType[]; // Defined in the concrete question a.k.a. question-wise
	tags: string[]; // Defined in the note that the question is in a.k.a. file-wise
}
