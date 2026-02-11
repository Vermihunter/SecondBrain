import Handlebars from "handlebars";

export function render_template(templateStr: string, variables: object) {
	const template = Handlebars.compile(templateStr);
	return template(variables);
}
