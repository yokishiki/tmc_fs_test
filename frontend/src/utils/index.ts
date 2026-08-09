
export function formQuery(options?: Record<string, any>) {
	if(!options)
		return "";

	const filledOptions: Record<string, any> = {};
	for(const key in options)
		if(options[key] !== undefined)
			filledOptions[key] = options[key];


	if(Object.keys(filledOptions).length === 0)
		return "";

	const queryParams = new URLSearchParams(filledOptions);
	return "?" + queryParams.toString();
}

export async function sleep(timeMs: number) {
	return new Promise(resolve => setTimeout(resolve, timeMs));
}

export function normalizeNumberOrString(value: number | string, trim?: boolean) {
	const result = String(value).toLowerCase();
	return trim ? result.trim() : result;
}