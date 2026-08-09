import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

import { DraggableTypes } from "../../types";

import { ItemComp } from "./BaseItem";

import type { Identifier, XYCoord } from "dnd-core";
import type { ItemProps } from "./BaseItem";
import type { ItemData, ItemDisplay, NormalizedItemId } from "../../types";


type DragItem = ItemDisplay & { index: number; };

type ItemDraggableProps = ItemProps & {
	index: number,
	onMoveCard: (dragIndex: number, hoverIndex: number) => void,
	onMoveEnd: (itemNormalizedId: NormalizedItemId, newIndex: number) => void,
};


export function DraggableItem(props: ItemDraggableProps) {
	const refDraggable = useRef<HTMLDivElement>(null);

	const lastNextRef = useRef<ItemDisplay["normalizedId"] | null>(null)

	const [{ handlerId }, connectDropTarget] = useDrop<
		DragItem,
		ItemData,
		{ handlerId: Identifier | null; }
	>({
		accept: DraggableTypes.ITEM,
		collect(monitor) {
			return {
				handlerId: monitor.getHandlerId(),
			};
		},
		hover(item: DragItem, monitor) {
			if(!refDraggable.current)
				return;

			const dragIndex = item.index;
			const hoverIndex = props.index;

			if(dragIndex === hoverIndex)
				return;

			const hoverBoundingRect = refDraggable.current?.getBoundingClientRect();

			const hoverMiddleY = hoverBoundingRect.height / 2;

			const clientOffset = monitor.getClientOffset();

			const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

			if(dragIndex < hoverIndex && hoverClientY < hoverMiddleY)
				return;

			if(dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
				return;

			props.onMoveCard(dragIndex, hoverIndex);

			lastNextRef.current = props.normalizedId;

			item.index = hoverIndex;
		},
	}, [props.index, props.normalizedId]);

	const [{ isDragging }, connectDragSource] = useDrag<DragItem, ItemData, { isDragging: boolean; }>({
		type: DraggableTypes.ITEM,
		item: () => ({ id: props.id, normalizedId: props.normalizedId, index: props.index }),
		isDragging: (monitor) => {
			return props.id === monitor.getItem().id;
		},
		collect(monitor) {
			return {
				isDragging: monitor.isDragging(),
			};
		},
		end(draggedItem: DragItem, monitor) {
			if(!monitor.didDrop())
				return;

			props.onMoveEnd(draggedItem.normalizedId, draggedItem.index);
		},
	}, [props.onMoveEnd]);

	const opacity = isDragging ? 0.5 : 1;
	connectDropTarget(connectDragSource(refDraggable));

	return (
		<div ref={ refDraggable } style={ { opacity } } data-handler-id={ handlerId }>
			<ItemComp ref={ props.ref } id={ props.id } normalizedId={ props.normalizedId } />
		</div>
	);
}