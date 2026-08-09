import { configureStore } from "@reduxjs/toolkit";

import itemsSlice, { saveCreatedItem, setSelectedItems, setUnselectedItems } from "./itemsSlice";
import listenerMiddleware from "./listenerMiddleware";

import requestsQuery from "../utils/requestsQuery";

import type { CreateItemResponse, GetItemsResponse, Item } from "../types";


export const store = configureStore({
	reducer: {
		items: itemsSlice,
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

requestsQuery.bindHandleResponse((res: GetItemsResponse & { type: "selected" | "unselected", append?: boolean; }) => {
	if(res.type === "selected")
		store.dispatch(setSelectedItems(res));
	else
		store.dispatch(setUnselectedItems(res));
}, (res: CreateItemResponse | { id: Item["id"], err: string; }) => {
	store.dispatch(saveCreatedItem(res));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;