import { useCallback } from "react";

import { ItemComp } from "../Item";
import VirtualizedList from "./VirtualizedList";

import useInfiniteScroll from "../../hooks/useInfiniteScroll";

import type { Item, ItemDisplay, NormalizedItemId } from "../../types";


export type ListProps = {
	items: ItemDisplay[],
	hasNext?: boolean,
	loading?: boolean,
	load?: (params?: { lastId?: Item["id"], filter?: string; }) => void,
	onItemSelect?: (itemNormalizedId: NormalizedItemId) => void,
};

export default function List(props: ListProps) {
	const { refTarget } = useInfiniteScroll({ prevent: !props.hasNext, load: props.load || (() => {}) });

	const renderItem = useCallback((item: ItemDisplay, index: number) => (
		<ItemComp
			key={ item.id }
			ref={ index === Math.max(props.items.length - 3, 0) ? refTarget : void 0 }
			id={ item.id }
			normalizedId={ item.normalizedId }
			isTemp={ item.isTemp }
			onSelect={ () => props.onItemSelect?.(item.normalizedId) }
		/>
	), [props.items.length, refTarget, props.onItemSelect]);

	return (
		<VirtualizedList
			items={ props.items }
			renderItem={ renderItem }
			hasNext={ props.hasNext }
			loading={ props.loading }
		/>
	);
}