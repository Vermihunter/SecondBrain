export type PropertySchema =
	| { type: "boolean" }
	| { type: "select"; options: (string | number)[] };

export type PropertySchemaMap = Record<string, PropertySchema>;
