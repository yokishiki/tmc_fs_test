import items from "../../data/items.ts";
import { ItemNotFoundError, ItemSelectedYetError, ItemUnselectedYetError, NotUniqueError, UnexpectedItemLostError } from "../../errors/index.ts";

import type { Item, ItemID } from "../../types/index.ts";

type ItemIdString = string;

const SIZE = 20;

class MainService {
	// общий массив объектов, неприкасаемый для перетасовок, выбора и прочего
	private itemsLib: Map<ItemIdString, Item>;
	private itemsSelectedOrder: ItemIdString[];
	private items: { id: ItemIdString, selected: boolean; }[];

	constructor() {
		this.itemsLib = new Map(items.map(item => [normalizeNumberOrString(item.id), item]));
		this.itemsSelectedOrder = [];
		this.items = Array.from(this.itemsLib.keys()).map(itemId => ({ id: itemId, selected: false }));
	}

	public getItemsUnselected(params: {
		lastId?: number | string | undefined,
		filter?: string | undefined,
	}): { items: Item[], hasNext: boolean; } {
		let indexFrom: number;
		if(params.lastId === undefined || !params.lastId)
			indexFrom = 0;
		else {
			const lastId = normalizeNumberOrString(params.lastId);
			indexFrom = this.items.findIndex(item => item.id === lastId);
			if(indexFrom === -1)
				throw new ItemNotFoundError(params.lastId);
			if(this.items[indexFrom]?.selected)
				throw new ItemNotFoundError(params.lastId);
			// увеличиваем на 1, потому что берём следующие элементы
			indexFrom += 1;
		}

		const filter = params.filter?.toLowerCase();

		const items: Item[] = [];
		let ptr = indexFrom;
		while(items.length < SIZE && ptr < this.items.length) {
			const item = this.items[ptr]!;
			if(item.selected) {
				ptr++;
				continue;
			}

			const itemIdRaw = item.id;
			const itemId = normalizeNumberOrString(itemIdRaw);
			if(!filter || itemId.includes(filter)) {
				const item = this.itemsLib.get(itemIdRaw);
				if(!item)
					throw new ItemNotFoundError(itemIdRaw);
				items.push(item);
			}
			ptr++;
		}

		return {
			items,
			hasNext: ptr < this.items.length,
		};
	}

	public getItemsSelected(params: {
		lastId?: number | string | undefined,
		filter?: string | undefined,
	}): { items: Item[], hasNext: boolean; } {
		let indexFrom: number;
		if(params.lastId === undefined || !params.lastId)
			indexFrom = 0;
		else {
			const lastId = normalizeNumberOrString(params.lastId);
			indexFrom = this.itemsSelectedOrder.findIndex(itemId => itemId === lastId);
			if(indexFrom === -1)
				throw new ItemNotFoundError(params.lastId);
			// увеличиваем на 1, потому что берём следующие элементы
			indexFrom += 1;
		}

		const filter = params.filter?.toLowerCase();

		const items: Item[] = [];
		let ptr = indexFrom;
		while(items.length < SIZE && ptr < this.itemsSelectedOrder.length) {
			const itemIdRaw = this.itemsSelectedOrder[ptr]!;
			const itemId = normalizeNumberOrString(itemIdRaw);
			if(!filter || itemId.includes(filter)) {
				const item = this.itemsLib.get(itemIdRaw);
				if(!item)
					throw new ItemNotFoundError(itemIdRaw);
				items.push(item);
			}
			ptr++;
		}

		return {
			items,
			hasNext: ptr < this.itemsSelectedOrder.length,
		};
	}

	/**
	 * Создаёт новый элемент, добавляет в начало списка невыбранных элементов
	 */
	public createItem(params: { id: string | number; }): Item {
		const normalizedId = normalizeNumberOrString(params.id);
		const isItemExists = this.itemsLib.has(normalizedId);
		if(isItemExists)
			throw new NotUniqueError(params.id);

		const item: Item = { id: params.id };

		this.itemsLib.set(normalizedId, item);
		this.items.splice(0, 0, { id: normalizedId, selected: false });

		return item;
	}

	/**
	 * Помечает элемент выбранным, добавляет его в начало списка
	 * @param itemId идентификатор элемента
	 */
	public selectItem(params: { itemId: ItemID; }): void {
		const itemNormalizedId = normalizeNumberOrString(params.itemId);
		const itemsIndex = this.items.findIndex(item => item.id === itemNormalizedId);

		if(itemsIndex === -1)
			throw new ItemNotFoundError(params.itemId);

		const item = this.items[itemsIndex];
		if(!item)
			throw new ItemNotFoundError(params.itemId);
		if(item.selected)
			throw new ItemSelectedYetError(params.itemId);
		// мутируем свойство класса
		item.selected = true;

		const selectedIndex = this.itemsSelectedOrder.indexOf(itemNormalizedId);

		// ситуации, когда элемент уже выбран на данном этапе не должно возникать,
		// но всё равно не считаем ошибкой
		if(selectedIndex >= 0)
			return;

		this.itemsSelectedOrder.splice(0, 0, itemNormalizedId);
	}

	/**
	 * Снимает выделение с элемента
	 */
	public deselectItem(itemId: ItemID): { prevUnselectedItemId?: ItemID; } {
		const ItemNormalizedId = normalizeNumberOrString(itemId);
		const itemIndex = this.items.findIndex(item => item.id === ItemNormalizedId);

		if(itemIndex === -1)
			throw new ItemNotFoundError(itemId);

		const item = this.items[itemIndex];
		if(!item)
			throw new ItemNotFoundError(itemId);
		if(!item.selected)
			throw new ItemUnselectedYetError(itemId);
		// мутируем свойство класса
		item.selected = false;

		let ptr = itemIndex;
		while(--ptr >= 0) {
			if(!this.items[ptr]!.selected)
				break;
		}

		const selectedIndex = this.itemsSelectedOrder.indexOf(ItemNormalizedId);
		if(selectedIndex !== -1)
			this.itemsSelectedOrder.splice(selectedIndex, 1);

		return ptr === -1 ? {} : { prevUnselectedItemId: this.items[ptr]!.id };
	}

	/**
	 * Перемещает элемент (из выбранных)
	 * @param itemId id элемента
	 * @param nextItemId id элемента, на месте которого нужно расположить перемещаемый
	 */
	public moveSelectedItem(params: { itemId: number | string, nextItemId?: number | string | undefined | null; }): void {
		const itemNormalizedId = normalizeNumberOrString(params.itemId);
		const currIndex = this.itemsSelectedOrder.indexOf(itemNormalizedId);
		if(currIndex === -1)
			throw new ItemNotFoundError(params.itemId);

		const item = this.itemsSelectedOrder.splice(currIndex, 1);

		if(typeof item[0] === "undefined")
			throw new UnexpectedItemLostError(params.itemId);
		let newIndex = typeof params.nextItemId === "string" || typeof params.nextItemId === "number" ?
			this.itemsSelectedOrder.indexOf(normalizeNumberOrString(params.nextItemId)) :
			this.itemsSelectedOrder.length;
		if(newIndex === -1)
			newIndex = this.itemsSelectedOrder.length;
		this.itemsSelectedOrder.splice(newIndex, 0, item[0]);
	}
}

export default new MainService();

function normalizeNumberOrString(value: number | string): string {
	return typeof value === "string" ? value.toLowerCase() : value.toString();
}