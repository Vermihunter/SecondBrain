export type AttributeType = "text" | "select" | "checkbox" | "number";

export interface TemplateAttribute {
	key: string;
	type: AttributeType;
	options?: string[];
}

export interface QuestionTemplate {
	id: string; // file path
	name: string;
	attributes: TemplateAttribute[];
}
