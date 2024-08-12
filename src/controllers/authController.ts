import type { Request, Response } from "express";
import authMethods from "../models/authMethods";

// Mock data from Stack webhook
// {
//   "event": "user.created",
//   "data": {
//     "id": "2209422a-eef7-4668-967d-be79409972c5",
//   }
// }

class AuthController {
	async postEvent(req: Request, res: Response) {
		try {
			const { event, data } = req.body;
			if (event === "user.created") {
				const userId = data.id;
				const newUser = await authMethods.insertUser(userId);
				if (newUser) {
					res.status(201).send(newUser);
				} else {
					res.status(500).send("Failed to register user!");
				}
			} else {
				console.error(`Failed to process event type: ${event}`);
				res.status(500).send("Failed to process event");
			}
		} catch (error) {
			res.status(500).send("Failed to register user!");
		}
	}
}

export default new AuthController();
