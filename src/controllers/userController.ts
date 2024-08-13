import type { Request, Response } from "express";
import userMethods from "../models/userMethods";

class UserController {
	async getOneUser(req: Request, res: Response): Promise<void> {
		try {
			const { user } = req;
			const userById = await userMethods.findUserById(user);
			if (userById) {
				res.status(200).send(userById);
			} else {
				res.status(404).send("User not found!");
			}
		} catch (error) {
			res.status(500).send("Could not fetch user!");
		}
	}

	async putUser(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const { username, profilePicture, nickname } = req.body;

			const userData = {
				username,
				nickname,
				profilePicture,
			};

			const updatedUser = await userMethods.updateUser(userId, userData);
			if (updatedUser) {
				res.status(201).send(updatedUser);
			} else {
				res.status(500).send("Could not create user!");
			}
		} catch (error) {
			res.status(500).send("Could not create user!");
		}
	}

	async postFriendController(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const { friendId } = req.params;

			if (!userId || !friendId) {
				res.status(400).send("Missing userId or friendId");
				return;
			}

			const success = await userMethods.insertFriend(userId, friendId);

			if (success) {
				res.status(201).send("Friend added successfully");
			} else {
				res
					.status(400)
					.send("Failed to add friend (already friends or users don't exist)");
			}
		} catch (error) {
			res.status(500).send("Error adding friend");
		}
	}

	async deleteFriendController(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const { friendId } = req.params;

			if (!userId || !friendId) {
				res.status(400).send("Missing userId or friendId");
				return;
			}

			const success = await userMethods.deleteFriend(userId, friendId);

			if (success) {
				res.status(202).send("Friend deleted successfully");
			} else {
				res.status(404).send("Friendship not found");
			}
		} catch (error) {
			res.status(500).send("Error deleting friend");
		}
	}

	async getAllFriends(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const users = await userMethods.findAllFriends(userId);
			res.status(200).send(users);
		} catch (error) {
			res.status(500).send("Could not fetch users!");
		}
	}
}

export default new UserController();
