import MainService from "../services/main/index.ts";
import { CustomError, ValidationError } from "../errors/index.ts";

import type { Request, Response } from "express";
import type { Item } from "../types/index.ts";


type ControllerRequest<
	Params = Record<string, unknown>,
	ReqBody = any,
	ReqQuery = Record<string, unknown>,
> = Request<Params, {}, ReqBody, ReqQuery>;

type GetItemsQuery = { lastId?: string | number | undefined, filter?: string | undefined; };
type GetItemsResponse = { items: Item[], hasNext: boolean; };

type CreateItemBody = { id: Item["id"]; };
type CreateItemResponse = Item;

type SelectItemParams = { itemId: string; };
type SelectItemResponse = { ok: true; };

type DeselectItemParams = { itemId: string; };
type DeselectItemResponse = { prevUnselectedItemId?: Item["id"]; };

type MoveItemParams = { itemId: Item["id"]; };
type MoveItemBody = { nextItemId: Item["id"] | null; };
type MoveItemResponse = { ok: true; };

type BatchCreate = { requestId: string, data: CreateItemBody; }[];
type BatchCreateResponse = { requestId: string, data: CreateItemResponse | { err: string; }; }[];

type BatchUpdate = (
	| { requestId: string, type: "select", data: SelectItemParams; }
	| { requestId: string, type: "move", data: MoveItemParams & MoveItemBody; }
)[];
type BatchUpdateResponse = { requestId: string, data: SelectItemResponse | MoveItemResponse | { err: string; }; }[];

type BatchGet = { type: "selected" | "unselected", requestId: string, data: GetItemsQuery; }[];
type BatchGetResponse = { requestId: string, data: GetItemsResponse | { err: string; }; }[];


class ItemsController {
	public async getItemsSelected(req: ControllerRequest<{}, {}, GetItemsQuery>, res: Response<GetItemsResponse>) {
		const query = req.query;
		const { lastId, filter } = getValidatedGetItemsParams(query);

		const result = MainService.getItemsSelected({ lastId, filter });
		return res.json(result);
	}

	public async getItemsUnselected(req: ControllerRequest<{}, {}, GetItemsQuery>, res: Response<GetItemsResponse>) {
		const query = req.query;
		const { lastId, filter } = getValidatedGetItemsParams(query);

		const result = MainService.getItemsUnselected({ lastId, filter });
		return res.json(result);
	}

	public async createItem(req: ControllerRequest<{}, CreateItemBody>, res: Response<CreateItemResponse>) {
		const body = req.body;
		if(!body || !("id" in body))
			throw new ValidationError("Неверный формат");

		if(typeof body.id !== "number" && typeof body.id !== "string")
			throw new ValidationError("Некорректное значение id");

		const result = MainService.createItem({ id: body.id });
		return res.status(201).json(result);
	}

	public async selectItem(req: ControllerRequest<SelectItemParams>, res: Response<SelectItemResponse>) {
		const params = req.params;

		if(!params || !("itemId" in params))
			throw new ValidationError("Необходимо указать параметры");

		const itemId = params.itemId;
		if(typeof itemId !== "string")
			throw new ValidationError("Некорректный идентификатор");

		MainService.selectItem({ itemId });

		res.json({ ok: true });
	}

	public async deselectItem(req: ControllerRequest<DeselectItemParams>, res: Response<DeselectItemResponse>) {
		const params = req.params;

		if(!params || !("itemId" in params))
			throw new ValidationError("Необходимо указать параметры");

		const itemId = params.itemId;
		if(typeof itemId !== "string")
			throw new ValidationError("Некорректный идентификатор");

		const result = MainService.deselectItem(itemId);

		res.json(result);
	}

	public async moveItem(req: ControllerRequest<MoveItemParams, MoveItemBody>, res: Response<MoveItemResponse>) {
		const params = req.params;

		if(!params || !("itemId" in params))
			throw new ValidationError("Необходимо указать параметры");
		const itemId = params.itemId;

		const body = req.body;

		if(!body)
			throw new ValidationError("Отсутствует тело запроса");

		let nextItemId: string | number | undefined = void 0;
		if(
			"nextItemId" in body &&
			(typeof body.nextItemId === "string" || typeof body.nextItemId === "number" || body.nextItemId === null)
		) {
			nextItemId = body.nextItemId ?? void 0;
		}

		MainService.moveSelectedItem({ itemId, nextItemId });

		res.json({ ok: true });
	}

	async handleBatchCreate(req: ControllerRequest<{}, BatchCreate>, res: Response<BatchCreateResponse>) {
		const body = req.body;

		const result: BatchCreateResponse = [];

		if(!body)
			return res.json(result);

		if(!Array.isArray(body))
			throw new ValidationError("Некорректное тело запроса");

		const toCreate: BatchCreate = [];

		for(const request of body) {
			if(typeof request.data?.id !== "number" && typeof request.data?.id !== "string")
				throw new ValidationError("Некорректное значение id");
			toCreate.push({ requestId: request.requestId, data: request.data });
		}

		for(const create of toCreate) {
			try {
				const createdItem = MainService.createItem(create.data);
				result.push({ requestId: create.requestId, data: createdItem });
			}
			catch(err) {
				console.error(err);
				result.push({ requestId: create.requestId, data: { err: err instanceof CustomError ? err.message : "Ошибка" } });
			}
		}

		return res.json(result);
	}

	async handleBatchUpdate(req: ControllerRequest<{}, BatchUpdate>, res: Response<BatchUpdateResponse>) {
		const body = req.body;

		const result: BatchUpdateResponse = [];

		if(!body)
			return res.json(result);

		if(!Array.isArray(body))
			throw new ValidationError("Некорректное тело запроса");

		const updates: BatchUpdate = [];

		for(const request of body) {
			switch(request.type) {
				case "move": {
					if(
						!request.data || !("itemId" in request.data) ||
						(typeof request.data.itemId !== "number" && typeof request.data.itemId !== "string")
					)
						throw new ValidationError("Некорректные параметры move");
					const itemId = request.data.itemId;

					let nextItemId: string | number | null = null;
					if(
						"nextItemId" in request.data && (
							typeof request.data.nextItemId === "string" ||
							typeof request.data.nextItemId === "number" ||
							request.data.nextItemId === null
						)
					)
						nextItemId = request.data.nextItemId;

					updates.push({ type: request.type, requestId: request.requestId, data: { itemId, nextItemId } });
					break;
				}
				case "select": {
					if(
						!request.data || !("itemId" in request.data) ||
						(typeof request.data.itemId !== "number" && typeof request.data.itemId !== "string")
					)
						throw new ValidationError("Некорректные параметры select");
					updates.push({ type: request.type, requestId: request.requestId, data: { itemId: request.data.itemId } });
					break;
				}
				default: {
					throw new ValidationError("Неизвестный тип");
				}
			}
		}

		for(const update of updates) {
			try {
				switch(update.type) {
					case "move":
						MainService.moveSelectedItem(update.data);
						break;
					case "select":
						MainService.selectItem(update.data);
						break;
				}
				result.push({ requestId: update.requestId, data: { ok: true } });
			}
			catch(err) {
				console.error(err);
				result.push({ requestId: update.requestId, data: { err: err instanceof CustomError ? err.message : "Ошибка" } });
				break;
			}
		}

		return res.json(result);
	}

	async handleBatchGet(req: ControllerRequest<{}, BatchGet>, res: Response<BatchGetResponse>) {
		const body = req.body;

		const result: BatchGetResponse = [];

		if(!body)
			return res.json(result);

		if(!Array.isArray(body))
			throw new ValidationError("Некорректное тело запроса");

		const gets: BatchGet = [];

		for(const request of body) {
			gets.push({ type: request.type, requestId: request.requestId, data: getValidatedGetItemsParams(request.data) });
		}

		for(const request of gets) {
			try {
				const getResult = request.type === "selected" ? MainService.getItemsSelected(request.data) : MainService.getItemsUnselected(request.data);
				result.push({ requestId: request.requestId, data: getResult });
			}
			catch(err) {
				console.error(err);
				result.push({ requestId: request.requestId, data: { err: err instanceof CustomError ? err.message : "Ошибка" } });
			}
		}

		return res.json(result);
	}
}

export default new ItemsController();

function getValidatedGetItemsParams(params: object): { lastId?: string | number | undefined, filter?: string | undefined; } {
	let lastId: number | string | undefined;
	if(params && "lastId" in params) {
		if(typeof params.lastId !== "string" && typeof params.lastId !== "number")
			throw new ValidationError("Некорректное значение id");
		lastId = String(params.lastId).toLowerCase();
	}
	else
		lastId = void 0;

	let filter: string | undefined;
	if(params && "filter" in params) {
		if(typeof params.filter !== "string")
			throw new ValidationError("Некорректное значение filter");
		filter = params.filter;
	}
	else
		filter = void 0;
	return { lastId, filter };
}