import { useEffect, useCallback, useMemo, useState } from "react";


export default function useInfiniteScroll({ threshold, prevent, load }: {
	threshold?: number;
	prevent?: boolean,
	load: () => void;
}) {
	const [target, setTarget] = useState<HTMLElement | null>(null);
	const refTarget = useCallback((element: HTMLElement | null) => {
		setTarget(element);
	}, []);

	const thresholdValue = useMemo(() => threshold || 0.5, [threshold]);

	const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
		if(entries.length > 0 && entries[0].isIntersecting)
			load();
	}, [load]);

	useEffect(() => {
		if(!target)
			return;

		if(prevent)
			return;

		const observer = new IntersectionObserver(handleObserver, { threshold: thresholdValue });
		observer.observe(target);

		return () => observer.disconnect();
	}, [target, handleObserver, prevent, threshold]);

	return { refTarget };
}