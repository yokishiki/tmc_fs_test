import { useRef, useCallback } from "react";


export default function useDebounce<CbArgs extends Array<any>>(cb: (...args: CbArgs) => void, timeoutMs: number) {
	const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

	return useCallback((...args: CbArgs) => {
		if(debounce.current !== null)
			clearTimeout(debounce.current);
		debounce.current = setTimeout(cb, timeoutMs, ...args);
	}, [cb]);
}