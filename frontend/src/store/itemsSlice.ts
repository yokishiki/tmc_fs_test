import { createSlice } from "@reduxjs/toolkit";

import { normalizeNumberOrString } from "../utils";

import type { PayloadAction } from "@reduxjs/toolkit";
import type { Item, ItemData, NormalizedItemId } from "../types";


export type ItemsState = {
	items: Record<NormalizedItemId, { item: Item, selected: boolean; }>,
	itemsToCreate: [NormalizedItemId, { item: ItemData, existsSelected?: boolean, existsUnselected?: boolean; }][],
	unselected: NormalizedItemId[],
	selected: NormalizedItemId[],
	unselectedHasNext: boolean,
	selectedHasNext: boolean,
	unselectedLoading: boolean,
	selectedLoading: boolean,
	filterUnselected: string | null,
	filterSelected: string | null,
};

const initialState: ItemsState = {
	items: {},
	itemsToCreate: [],
	unselected: [],
	selected: [],
	unselectedHasNext: false,
	selectedHasNext: false,
	unselectedLoading: false,
	selectedLoading: false,
	filterSelected: null,
	filterUnselected: null,
};

export const itemsSlice = createSlice({
	name: "items",
	initialState,
	reducers: {
		createItem: (state, action: PayloadAction<{ item: ItemData; }>) => {
			const normalizedId = normalizeNumberOrString(action.payload.item.id, true);
			if(state.items[normalizedId])
				return;
			const existingIndex = state.itemsToCreate.findIndex(item => item[0] === normalizedId);
			if(existingIndex !== -1)
				return;
			state.itemsToCreate.push([normalizedId, { item: action.payload.item }]);
		},
		saveCreatedItem: (state, action: PayloadAction<Item | { id: Item["id"], err: string; }>) => {
			const normalizedId = normalizeNumberOrString(action.payload.id, true);
			const itemIndex = state.itemsToCreate.findIndex(item => item[0] === normalizedId);

			if(!("err" in action.payload)) {
				state.items[normalizedId] = { item: { id: action.payload.id }, selected: false };
				state.unselected.splice(0, 0, normalizedId);
			}

			if(itemIndex >= 0)
				state.itemsToCreate.splice(itemIndex, 1);
		},
		setSelectedItems: (state, action: PayloadAction<{ items: Item[], hasNext: boolean, append?: boolean; }>) => {
			if(!action.payload.append)
				state.selected = [];

			for(const item of action.payload.items) {
				const normalizedId = normalizeNumberOrString(item.id, true);
				const existingItem = state.items[normalizedId];
				if(existingItem) {
					if(!existingItem.selected) {
						const unselectedIndex = state.unselected.indexOf(normalizedId);
						if(unselectedIndex !== -1)
							state.unselected.splice(unselectedIndex, 1);
						existingItem.selected = true;
					}
				}
				else
					state.items[normalizedId] = { item, selected: true };

				const existingItemToCreateIndex = state.itemsToCreate.findIndex(item => item[0] === normalizedId);
				if(existingItemToCreateIndex >= 0)
					state.itemsToCreate[existingItemToCreateIndex][1].existsSelected = true;

				state.selected.push(normalizedId);
			}
			state.selectedHasNext = action.payload.hasNext;
			state.selectedLoading = false;
		},
		setUnselectedItems: (state, action: PayloadAction<{ items: Item[], hasNext: boolean, append?: boolean; }>) => {
			if(!action.payload.append)
				state.unselected = [];
			for(const item of action.payload.items) {
				const normalizedId = normalizeNumberOrString(item.id, true);
				const existingItem = state.items[normalizedId];

				if(existingItem) {
					if(existingItem.selected) {
						const selectedIndex = state.selected.indexOf(normalizedId);
						if(selectedIndex !== -1)
							state.selected.splice(selectedIndex, 1);
						existingItem.selected = false;
					}
				}
				else
					state.items[normalizedId] = { item, selected: false };

				const existingItemToCreateIndex = state.itemsToCreate.findIndex(item => item[0] === normalizedId);
				if(existingItemToCreateIndex >= 0)
					state.itemsToCreate[existingItemToCreateIndex][1].existsUnselected = true;

				state.unselected.push(normalizedId);
			}
			state.unselectedHasNext = action.payload.hasNext;
			state.unselectedLoading = false;
		},
		moveSelectedItem: (state, action: PayloadAction<{ itemId: NormalizedItemId, nextItemId: NormalizedItemId | null; }>) => {
			if(action.payload.itemId === action.payload.nextItemId)
				return;

			const itemIndex = state.selected.indexOf(action.payload.itemId);
			if(itemIndex === -1)
				return;

			let nextIndex: number;

			if(action.payload.nextItemId !== null) {
				nextIndex = state.selected.indexOf(action.payload.nextItemId);
				if(nextIndex === -1)
					return;
				if(itemIndex < nextIndex)
					nextIndex -= 1;
			}
			else
				nextIndex = state.selected.length;
			const [itemId] = state.selected.splice(itemIndex, 1);
			state.selected.splice(nextIndex, 0, itemId);

		},
		selectItem: (state, action: PayloadAction<{ itemId: NormalizedItemId; }>) => {
			const item = state.items[action.payload.itemId];
			if(!item)
				return;
			const unselectedIndex = state.unselected.indexOf(action.payload.itemId);
			const selectedIndex = state.selected.indexOf(action.payload.itemId);
			if(unselectedIndex !== -1)
				state.unselected.splice(unselectedIndex, 1);
			if(selectedIndex === -1)
				state.selected.splice(0, 0, action.payload.itemId);
			item.selected = true;
		},
		getItemsSelected: (state, _action: PayloadAction<GetItemsPayload>) => {
			state.selectedLoading = true;
		},
		getItemsUnselected: (state, _action: PayloadAction<GetItemsPayload>) => {
			state.unselectedLoading = true;
		},
		filterUnselected: (state, action: PayloadAction<{ filterValue: string; }>) => {
			const normalizedFilterValue = normalizeNumberOrString(action.payload.filterValue);
			state.unselected = state.unselected.filter(normalizedItemId => normalizedItemId.includes(normalizedFilterValue));
			state.filterUnselected = action.payload.filterValue;
		},
		filterSelected: (state, action: PayloadAction<{ filterValue: string; }>) => {
			const normalizedFilterValue = normalizeNumberOrString(action.payload.filterValue);
			state.selected = state.selected.filter(normalizedItemId => normalizedItemId.includes(normalizedFilterValue));
			state.filterSelected = action.payload.filterValue;
		}
	},
});

export const {
	setUnselectedItems, setSelectedItems, createItem, saveCreatedItem,
	moveSelectedItem, selectItem,
	getItemsSelected, getItemsUnselected, filterSelected, filterUnselected,
} = itemsSlice.actions;

export default itemsSlice.reducer;

type GetItemsPayload = { lastId?: number | string, filter?: string; } | undefined;