import express from "express";

import controller from "../controllers/items.ts";


const router = express.Router();


router.get("/selected", controller.getItemsSelected);
router.get("/unselected", controller.getItemsUnselected);
router.post("/", controller.createItem);

router.patch("/select/:itemId", controller.selectItem);
router.delete("/select/:itemId", controller.deselectItem);

router.patch("/move/:itemId", controller.moveItem);

router.post("/batch/create", controller.handleBatchCreate);
router.post("/batch/update", controller.handleBatchUpdate);
router.post("/batch/get", controller.handleBatchGet);

export default router;