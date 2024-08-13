import express from "express";
import authController from "../controllers/authController";

export const authRouter = express.Router();

<<<<<<< Updated upstream
authRouter.get("/", (req, res) => {
	res.send("Auth endpoint hit!");
});
=======
<<<<<<< Updated upstream
=======
authRouter.get("/", (req, res) => {
	res.send("Hop Auth Endpoint!");
});
>>>>>>> Stashed changes
>>>>>>> Stashed changes
authRouter.post("/", authController.postEvent);
