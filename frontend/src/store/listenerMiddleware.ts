import { createListenerMiddleware } from "@reduxjs/toolkit";

import RequestsQuery from "../utils/requestsQuery";

import { selectItem, createItem, moveSelectedItem, getItemsSelected, getItemsUnselected } from './itemsSlice';


const listenerMiddleware = createListenerMiddleware();


listenerMiddleware.startListening({
	actionCreator: createItem,
	effect: async action => {
		RequestsQuery.addCreate(action.payload);
	},
});

listenerMiddleware.startListening({
	actionCreator: getItemsSelected,
	effect: async action => {
		RequestsQuery.addGet({ type: "selected", ...action.payload });
	},
});

listenerMiddleware.startListening({
	actionCreator: getItemsUnselected,
	effect: async action => {
		RequestsQuery.addGet({ type: "unselected", ...action.payload });
	},
});

listenerMiddleware.startListening({
	actionCreator: selectItem,
	effect: async action => {
		RequestsQuery.addSelect(action.payload);
	},
});

listenerMiddleware.startListening({
	actionCreator: moveSelectedItem,
	effect: async action => {
		RequestsQuery.addMove(action.payload);
	},
});

export default listenerMiddleware