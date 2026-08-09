import { useCallback, useEffect, useState } from "react";

import { DraggableList } from "../List";
import Filter from "./Filter";

import useDebounce from "../../hooks/useDebounce";

import { filterSelected, getItemsSelected, moveSelectedItem } from "../../store/itemsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

import type { Item, NormalizedItemId } from "../../types";

import styles from "./main.module.scss";


export default function SelectedList() {
	const [filterValue, setFilterValue] = useState<string>("");

	const itemsData = useAppSelector(state => {
		return {
			items: state.items.selected.map(itemId => ({ id: state.items.items[itemId]!.item.id, normalizedId: itemId })),
			hasNext: state.items.selectedHasNext,
		};
	});

	const loading = useAppSelector(state => state.items.selectedLoading);

	const dispatch = useAppDispatch();

	const getItems = useCallback((params?: { lastId?: Item["id"], filter?: string; }) => {
		dispatch(getItemsSelected(params));
	}, []);

	const updateFilter = (filterValue: string) => {
		dispatch(filterSelected({ filterValue }));
		dispatch(getItemsSelected({ lastId: void 0, filter: filterValue }));
	};

	const updateFilterDebounced = useDebounce(updateFilter, 500);

	const onFilterChange = (value: string) => {
		setFilterValue(value);
		updateFilterDebounced(value);
	};

	const appendItems = useCallback(() => {
		dispatch(getItemsSelected({ lastId: itemsData.items.length > 0 ? itemsData.items.at(-1)!.id : void 0, filter: filterValue }));
	}, [itemsData.items, filterValue]);

	const onMoveEnd = useCallback((itemId: NormalizedItemId, nextItemId: NormalizedItemId) => {
		dispatch(moveSelectedItem({ itemId, nextItemId }));
	}, []);

	useEffect(getItems, []);

	return (
		<div className={ styles.wrapper }>
			<Filter value={ filterValue } updateValue={ onFilterChange } />
			<DraggableList
				items={ itemsData.items }
				hasNext={ itemsData.hasNext }
				loading={ loading }
				getItems={ appendItems }
				onMoveEnd={ onMoveEnd }
			/>
		</div>
	);
}