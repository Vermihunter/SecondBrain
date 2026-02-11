/**
 * Represents the type to use in render_template with a question
 * template such as the default_templates/DefaultQuestionTemplate.ts
 */
export default interface QuestionGeneratingType {
	key: string;
	label: string;
	val: string | number | boolean;
	cssClass: string;
}
