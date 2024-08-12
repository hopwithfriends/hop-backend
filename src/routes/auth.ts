import express from "express";
import authController from "../controllers/authController";

export const authRouter = express.Router();

authRouter.get("/", (req, res) => {
	res.send("Auth endpoint hit!");
});
authRouter.post("/", authController.postEvent);
