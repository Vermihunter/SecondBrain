import { AttributeType } from "./AttributeType";

/**
 * Represents one attribute of the template
 */
export interface TemplateAttribute {
	key: string;
	type: AttributeType;
	options?: string[]; // The options for 'select'
	cssMode: "key" | "key-value";
}

/**
 * Represents a Question template saved in an external file
 */
export interface QuestionAttributeTemplate {
	id: string; // file path
	name: string;
	attributes: TemplateAttribute[];
}
