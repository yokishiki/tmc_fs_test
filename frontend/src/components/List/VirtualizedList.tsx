import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { ItemDisplay } from "../../types";


export type ListProps = {
	items: ItemDisplay[],
	hasNext?: boolean,
	loading?: boolean,
	renderItem: (item: ItemDisplay, index: number) => React.JSX.Element,
};

export default function VirtualizedList(props: ListProps) {
	const refParent = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: props.hasNext ? props.items.length + 1 : props.items.length,
		getScrollElement: () => refParent.current,
		estimateSize: () => 100,
		overscan: 5,
	});

	return (
		<div ref={ refParent }>
			<div
				style={ {
					height: `${ rowVirtualizer.getTotalSize() }px`,
					width: "100%",
					position: "relative",
				} }
			>
				{ rowVirtualizer.getVirtualItems().map(virtualRow => {
					const isLoaderRow = virtualRow.index > props.items.length - 1;
					const item = props.items[virtualRow.index];

					return (
						<div
							key={ virtualRow.index }

							style={ {
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${ virtualRow.size }px`,
								transform: `translateY(${ virtualRow.start }px)`,
							} }
						>
							{ isLoaderRow ? props.loading ? "Загрузка..." : null : props.renderItem(item, virtualRow.index) }
						</div>
					);
				}) }
			</div>
		</div>
	);
}