import type { Item } from "../types/index.ts";


const DEFAULT_SIZE = process.env.NODE_ENV === "production" ? 1_000_000 : 1000;

const data = (() => {
	return Array.from<unknown, Item>({ length: DEFAULT_SIZE }, (_, i) => ({ id: i + 1 }));
})();

export default data;