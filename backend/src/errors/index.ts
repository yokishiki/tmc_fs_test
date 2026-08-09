import type { ItemID } from "../types/index.ts";


export class CustomError extends Error {}

export class ValidationError extends CustomError {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

export class NotUniqueError extends CustomError {
	constructor(itemId: ItemID) {
		super(`Значение id ${ itemId } неуникально`);
		this.name = "NotUniqueError";
	}
}

export class ItemNotFoundError extends CustomError {
	constructor(itemId: ItemID) {
		super(`Элемент с id ${ itemId } не найден`);
		this.name = "ItemNotFoundError";
	}
}

export class ItemSelectedYetError extends CustomError {
	constructor(itemId: ItemID) {
		super(`Элемент с id ${ itemId } уже выбран`);
		this.name = "ItemSelectedYetError";
	}
}

export class ItemUnselectedYetError extends CustomError {
	constructor(itemId: ItemID) {
		super(`Элемент с id ${ itemId } уже убран`);
		this.name = "ItemUnselectedYetError";
	}
}

export class UnexpectedItemLostError extends CustomError {
	constructor(itemId: ItemID) {
		super(`Непредведенная потеря элемента ${ itemId }`);
		this.name = "UnexpectedItemLostError";
	}
}