import dotenv from "dotenv";
import path from "path";


const srcDir = path.dirname(import.meta.dirname);

dotenv.config({ path: [path.join(srcDir, ".env"), path.join(srcDir, ".env.local")], override: true });

import express from "express";
import cors from "cors";

import routerItems from "./routers/items.ts";
import errorHandler from "./middlewares/errorHandler.ts";


if(!process.env.PORT)
	throw new Error("No port");
const port = +process.env.PORT;
const origin = process.env.CORS;

const app = express();

app.use(cors(origin ? { origin } : void 0));
app.use(express.json());
app.use(express.urlencoded());

app.use("/items", routerItems);

app.use(errorHandler);


app.listen(port, () => {
	console.log(`App listening on port ${ port }`);
});