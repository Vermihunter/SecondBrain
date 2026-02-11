export class TemplaterError extends Error {
	constructor(
		msg: string,
		public console_msg?: string,
	) {
		super(msg);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export async function errorWrapper<T>(
	fn: () => Promise<T>,
	msg: string,
): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		return null as T;
	}
}

export function errorWrapperSync<T>(fn: () => T, msg: string): T {
	try {
		return fn();
	} catch (e) {
		return null as T;
	}
}
