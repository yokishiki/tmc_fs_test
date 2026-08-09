import type { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors/index.ts";


export default function errorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
	console.error(err);
	if(res.headersSent)
		return next(err);

	if(err instanceof CustomError)
		res.status(403).send(err.message);
	else
		res.status(500).send("Ошибка!");
}