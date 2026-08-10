import { uuid } from "uuidv4";

import { sleep } from ".";
import { batchCreate, batchGet, batchUpdate } from "../api";

import type { CreateItemResponse, GetItemsResponse, Item } from "../types";


type ItemCreate = { requestId: string, data: Item; };
type ItemGet = { type: "selected" | "unselected", requestId: string, data: { lastId?: Item["id"], filter?: string; }; };
type ItemSelect = { type: "select", requestId: string, data: { itemId: Item["id"]; }; };
type ItemMove = { type: "move", requestId: string, data: { itemId: Item["id"], nextItemId: Item["id"] | null; }; };

export type HandleGetResponseFn = (res: GetItemsResponse & { type: "selected" | "unselected", append?: boolean; }) => void;
export type HandleCreateResponseFn = (res: CreateItemResponse | { id: Item["id"], err: string; }) => void;

class RequestsQuery {
	private handleGetResponse: HandleGetResponseFn | null = null;
	private handleCreateResponse: HandleCreateResponseFn | null = null;

	private gets: ItemGet[] = [];
	private creates: ItemCreate[] = [];
	private updates: (ItemMove | ItemSelect)[] = [];

	constructor() {
		this.run();
	}

	async run() {
		(async () => {
			while(true) {
				const p1 = performance.now();
				const toCreate = this.creates.splice(0);
				if(toCreate.length > 0)
					await batchCreate(toCreate).then(res => {
						if("err" in res) {
							alert(res.err);
							return;
						}
						for(const result of res) {
							// TODO: обработка ошибок
							if("id" in result.data)
								this.handleCreateResponse?.(result.data);
							else {
								const request = toCreate.find(req => req.requestId === result.requestId);
								if(request)
									this.handleCreateResponse?.({ id: request.data.id, err: result.data.err });
							}
						}
					});
				const p2 = performance.now();
				await sleep(Math.max(10000 - (p2 - p1), 0));
			}
		})();

		(async () => {
			while(true) {
				const p1 = performance.now();

				const toUpdate = this.updates.splice(0);
				if(toUpdate.length > 0) {
					await batchUpdate(toUpdate).then(res => {
						if("err" in res) {
							alert(res.err);
							return;
						}
						for(const _result of res) {
							// TODO: обработка ошибок
						}
					});
				}

				const p2 = performance.now();
				await sleep(Math.max(1000 - (p2 - p1), 0));
			}
		})();

		(async () => {
			while(true) {
				const p1 = performance.now();

				const toGet = this.gets.splice(0);
				if(toGet.length > 0) {
					await batchGet(toGet).then(res => {
						if("err" in res) {
							alert(res.err);
							return;
						}
						for(const result of res) {
							const response = result.data;
							if("err" in response) {
								// TODO: обработка ошибок
								continue;
							}
							const request = toGet.find(req => req.requestId === result.requestId);
							if(request && this.handleGetResponse) {
								this.handleGetResponse({
									hasNext: response.hasNext,
									items: response.items,
									type: request.type,
									append: typeof request.data.lastId === "number" || typeof request.data.lastId === "string",
								});
							}
						}
					});
				}

				const p2 = performance.now();
				await sleep(Math.max(1000 - (p2 - p1), 0));
			}
		})();
	}

	public addGet(params: { type: "selected" | "unselected", lastId?: Item["id"], filter?: string; }) {
		const { type, ...options } = params;
		const existingIndex = this.gets.findIndex(request => request.type === type);
		if(existingIndex === -1)
			this.gets.push({ type, requestId: uuid(), data: options });
		else
			this.gets[existingIndex].data = options;
	}

	public addCreate(params: { item: Item; }) {
		const itemNormalizedId = String(params.item.id).toLowerCase();
		const existingIndex = this.creates.findIndex(itemToCreate => String(itemToCreate.data.id).toLowerCase() === itemNormalizedId);
		if(existingIndex === -1)
			this.creates.push({ requestId: uuid(), data: params.item });
	}

	public addMove(params: { itemId: Item["id"], nextItemId: Item["id"] | null; }) {
		if(this.updates.length > 0) {
			const lastUpdate = this.updates.at(-1)!;
			if(lastUpdate.type === "move" && lastUpdate.data.itemId === params.itemId && lastUpdate.data.nextItemId === params.nextItemId)
				return;
		}
		this.updates.push({ type: "move", requestId: uuid(), data: params });
	}

	public addSelect(params: { itemId: Item["id"]; }) {
		if(this.updates.length > 0) {
			const lastUpdate = this.updates.at(-1)!;
			if(lastUpdate.type === "select" && lastUpdate.data.itemId === params.itemId)
				return;
		}
		this.updates.push({ type: "select", requestId: uuid(), data: params });
	}

	public bindHandleResponse(fnGet: HandleGetResponseFn, fnCreate: HandleCreateResponseFn) {
		this.handleGetResponse = fnGet;
		this.handleCreateResponse = fnCreate;
	}
}

export default new RequestsQuery();