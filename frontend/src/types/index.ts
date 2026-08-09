export type Item = { id: number | string; };

export type NormalizedItemId = string;

export type ItemData = { id: Item["id"], normalizedId: NormalizedItemId; };
export type ItemDisplay = ItemData & { isTemp?: boolean }

export const DraggableTypes = {
	ITEM: "item",
};

//#region API

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiError = { status?: number, err: string; };
export type ApiResponse<T> = Promise<T | ApiError>;

/** 
 * ITEMS
 */

// Get items
export type GetItemsQuery = { lastId?: number | string, filter?: string; };
export type GetItemsResponse = { items: Item[], hasNext: boolean; };

// Create item
export type CreateItemBody = { id: Item["id"]; };
export type CreateItemResponse = Item;

// Select item
export type SelectItemParams = { itemId: Item["id"]; };
export type SelectItemResponse = { ok: true; };

// Deselect item
export type DeselectItemParams = { itemId: Item["id"]; };
export type DeselectItemResponse = { prevUnselectedItemId?: Item["id"]; };

// Move item
export type MoveItemParams = { itemId: Item["id"]; };
export type MoveItemBody = { nextItemId: Item["id"] | null; };
export type MoveItemResponse = { ok: true; };

// Batch
export type BatchCreate = { requestId: string, data: CreateItemBody; }[];
export type BatchCreateResponse = { requestId: string, data: CreateItemResponse | { err: string; }; }[];

export type BatchUpdate = (
	| { requestId: string, type: "select", data: SelectItemParams; }
	| { requestId: string, type: "move", data: MoveItemParams & MoveItemBody; }
)[];
export type BatchUpdateResponse = { requestId: string, data: SelectItemResponse | MoveItemResponse | { err: string; }; }[];

export type BatchGet = { type: "selected" | "unselected", requestId: string, data: GetItemsQuery; }[];
export type BatchGetResponse = { requestId: string, data: GetItemsResponse | { err: string; }; }[];

//#endregion