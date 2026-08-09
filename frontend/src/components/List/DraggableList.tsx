import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import useInfiniteScroll from "../../hooks/useInfiniteScroll";

import { DraggableItem } from "../Item";
import VirtualizedList from "./VirtualizedList";

import type { Item, ItemData, NormalizedItemId } from "../../types";


type DraggableListProps = {
	items: ItemData[],
	hasNext?: boolean,
	loading?: boolean,
	onMoveEnd(itemId: Item["id"], nextItem?: Item["id"]): void,
	getItems(params?: { lastId?: Item["id"], filter?: string; }): void,
};

export default function DraggableList(props: DraggableListProps) {
	return (
		<DndProvider backend={ HTML5Backend }>
			<List { ...props } />
		</DndProvider>
	);
}

function List(props: DraggableListProps) {
	const [items, setItems] = useState<ItemData[]>(props.items);

	const { refTarget } = useInfiniteScroll({ prevent: !props.hasNext, load: props.getItems });

	const onMoveCard = useCallback((dragIndex: number, hoverIndex: number) => {
		setItems((prevItems: ItemData[]) => {
			let newArr: ItemData[];
			if(dragIndex > hoverIndex)
				newArr = [
					...prevItems.slice(0, hoverIndex),
					prevItems[dragIndex],
					...prevItems.slice(hoverIndex, dragIndex),
					...prevItems.slice(dragIndex + 1)
				];
			else
				newArr = [
					...prevItems.slice(0, dragIndex),
					...prevItems.slice(dragIndex + 1, hoverIndex + 1),
					prevItems[dragIndex],
					...prevItems.slice(hoverIndex + 1),
				];
			return newArr;
		});
	}, []);

	const onMoveEnd = (itemNormalizedId: NormalizedItemId, newIndex: number) => {
		const itemIndex = items.findIndex(item => item.normalizedId === itemNormalizedId);
		if(itemIndex === -1)
			return;
		console.log(itemNormalizedId, itemIndex,  newIndex, items[newIndex].normalizedId, items);
		if(itemIndex < newIndex)
			newIndex += 1;
		props.onMoveEnd(itemNormalizedId, newIndex  < items.length ? items[newIndex].normalizedId : void 0);
	};


	const renderItem = useCallback((item: ItemData, index: number) => (
		<DraggableItem
			key={ item.id }
			ref={ index === Math.max(items.length - 3, 0) ? refTarget : void 0 }
			id={ item.id }
			normalizedId={ item.normalizedId }
			index={ index }
			onMoveCard={ onMoveCard }
			onMoveEnd={ onMoveEnd }
		/>
	), [items.length, onMoveEnd]);

	useEffect(() => {
		setItems(props.items);
	}, [props.items]);

	return (
		<VirtualizedList
			items={ items }
			hasNext={ props.hasNext }
			loading={ props.loading }
			renderItem={ renderItem }
		/>
	);
}