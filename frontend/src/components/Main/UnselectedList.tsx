import { useCallback, useEffect, useState } from "react";

import { PlainList } from "../List";
import Filter from "./Filter";

import useDebounce from "../../hooks/useDebounce";

import { createItem, filterUnselected, getItemsUnselected, selectItem } from "../../store/itemsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

import { normalizeNumberOrString } from "../../utils";

import type { Item, ItemDisplay, NormalizedItemId } from "../../types";

import styles from "./main.module.scss";


export default function UnselectedList() {
	const [filterValue, setFilterValue] = useState<string>("");

	const storedItems: ItemDisplay[] = useAppSelector(state => {
		const tempItems: ItemDisplay[] = state.items.itemsToCreate.map(item => ({ ...item[1].item, isTemp: true }));
		const items = state.items.unselected.map(itemId => ({ id: state.items.items[itemId]!.item.id, normalizedId: itemId }));

		return tempItems.concat(items);
	});
	const hasNext = useAppSelector(state => state.items.unselectedHasNext);
	const loading = useAppSelector(state => state.items.unselectedLoading);

	const dispatch = useAppDispatch();

	const getItems = useCallback((params?: { lastId?: Item["id"], filter?: string; }) => {
		dispatch(getItemsUnselected(params));
	}, []);

	const appendItems = useCallback(() => {
		const lastItem = storedItems.length > 0 ? storedItems.at(-1)! : null;
		dispatch(getItemsUnselected({ lastId: lastItem && !lastItem.isTemp ? lastItem.id : void 0, filter: filterValue }));
	}, [storedItems, filterValue]);

	const onItemSelect = useCallback((itemNormalizedId: NormalizedItemId) => {
		dispatch(selectItem({ itemId: itemNormalizedId }));
	}, []);

	const updateFilter = useCallback((filterValue: string) => {
		dispatch(filterUnselected({ filterValue }));
		dispatch(getItemsUnselected({ lastId: void 0, filter: filterValue }));
	}, []);

	const updateFilterDebounced = useDebounce(updateFilter, 500);

	const onFilterChange = useCallback((value: string) => {
		setFilterValue(value);
		updateFilterDebounced(value);
	}, []);

	useEffect(getItems, []);

	return (
		<div className={ styles.wrapper }>
			<Filter value={ filterValue } updateValue={ onFilterChange } />
			<NewItem />
			<PlainList
				items={ storedItems }
				hasNext={ hasNext }
				loading={ loading }
				load={ appendItems }
				onItemSelect={ onItemSelect }
			/>
		</div>
	);
}

function NewItem() {
	const [adding, setAdding] = useState<boolean>(false);

	const dispatch = useAppDispatch();

	const add = useCallback(() => setAdding(true), []);

	const cancel = useCallback(() => setAdding(false), []);

	const save = useCallback((event: React.SubmitEvent) => {
		event.preventDefault();
		const value = event.target["new-id"].value.trim();
		dispatch(createItem({ item: { id: value, normalizedId: normalizeNumberOrString(value) } }));
		setAdding(false);
	}, []);

	return (
		<div>
			{ adding ? (
				<form className={ styles.add } onSubmit={ save } onReset={ cancel }>
					<div className={ styles.value }>
						<span>Id:</span>
						<input name="new-id" />
					</div>
					<div className={ styles.controls }>
						<button type="submit">Сохранить</button>
						<button type="reset">Отмена</button>
					</div>
				</form>
			) : (<button type="button" onClick={ add }>Добавить</button>) }
		</div>
	);
}