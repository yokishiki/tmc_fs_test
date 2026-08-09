import { formQuery } from "./utils/index";

import type {
	Item,
	RequestMethod, ApiResponse,
	GetItemsQuery, GetItemsResponse, CreateItemBody, CreateItemResponse,
	SelectItemResponse, DeselectItemResponse, MoveItemBody, MoveItemResponse,
	BatchCreate, BatchCreateResponse, BatchUpdate, BatchUpdateResponse, BatchGetResponse, BatchGet,
} from "./types";


const apiHost = import.meta.env.VITE_HOST;

async function fetchData<T>(params: {
	// изменяемая часть роута
	url: string,
	method: RequestMethod,
	host?: string,
	query?: Record<string, any>,
	body?: Record<string, any> | FormData,
	headers?: Record<string, string>,
	signal?: AbortSignal,
	isFormData?: boolean,
}): ApiResponse<T> {
	const host = params.host || apiHost;
	const fullUrl = `${ host }/${ params.url }${ formQuery(params.query) }`;

	const requestInit: Omit<RequestInit, "headers"> & { headers: Record<string, string>; } = {
		method: params.method,
		signal: params.signal,
		headers: { ...(params.headers || {}), "Accept": "application/json", "Access-Control-Allow-Origin": "*" },
	};

	if(params.body) {
		if(params.isFormData) {
			if(params.body instanceof FormData)
				requestInit.body = params.body;
			else {
				const formData = new FormData();
				for(const key in params.body)
					formData.append(key, params.body[key]);
				requestInit.body = formData;
			}
		}
		else {
			requestInit.body = JSON.stringify(params.body);
			requestInit.headers["Content-Type"] = "application/json";
		}
	}

	return fetch(fullUrl, requestInit)
		.then((res: Response) => {
			if(res.ok)
				return res.json();
			else
				throw res;
		})
		.catch((err) => {
			if(err instanceof Response)
				return { status: err.status, err: err.body };
			return { err: "Ошибка" };
		});
}

export async function getItems(type: "selected" | "unselected", query?: GetItemsQuery): ApiResponse<GetItemsResponse> {
	return fetchData<GetItemsResponse>({
		url: `items/${ type }`,
		method: "GET",
		query,
	});
}

export async function createItem(body: CreateItemBody): ApiResponse<CreateItemResponse> {
	return fetchData<CreateItemResponse>({
		url: `items`,
		method: "POST",
		body,
	});
}

;

export async function selectItem(itemId: Item["id"]): ApiResponse<SelectItemResponse> {
	return fetchData<SelectItemResponse>({
		url: `items/select/${ itemId }`,
		method: "PATCH",
	});
}


export async function deselectItem(itemId: Item["id"]): ApiResponse<DeselectItemResponse> {
	return fetchData<DeselectItemResponse>({
		url: `items/select/${ itemId }`,
		method: "DELETE",
	});
}

export async function moveItem(itemId: Item["id"], body: MoveItemBody): ApiResponse<MoveItemResponse> {
	return fetchData<MoveItemResponse>({
		url: `items/move/${ itemId }`,
		method: "PATCH",
		body,
	});
}

export async function batchCreate(body: BatchCreate): ApiResponse<BatchCreateResponse> {
	return fetchData<BatchCreateResponse>({
		url: `items/batch/create`,
		method: "POST",
		body,
	});
}

export async function batchUpdate(body: BatchUpdate): ApiResponse<BatchUpdateResponse> {
	return fetchData<BatchUpdateResponse>({
		url: `items/batch/update`,
		method: "POST",
		body,
	});
}

export async function batchGet(body: BatchGet): ApiResponse<BatchGetResponse> {
	return fetchData<BatchGetResponse>({
		url: `items/batch/get`,
		method: "POST",
		body,
	});
}