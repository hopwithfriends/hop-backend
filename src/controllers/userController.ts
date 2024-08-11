import type { Request, Response } from "express";
import userMethods from "../models/userMethods";

class UserController {
	async getAllUsers(req: Request, res: Response): Promise<void> {
		try {
			const users = await userMethods.findAllUsers();
			res.status(200).send(users);
		} catch (error) {
			res.status(500).send("Could not fetch users!");
		}
	}

	async getOneUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const user = await userMethods.findUserById(id);
			if (user) {
				res.status(200).send(user);
			} else {
				res.status(404).send("User not found!");
			}
		} catch (error) {
			res.status(500).send("Could not fetch user!");
		}
	}

	async postUser(req: Request, res: Response): Promise<void> {
		try {
			const { username, password, email, profilePicture, nickname } = req.body;
			const newUser = await userMethods.insertUser(
				username,
				password,
				email,
				profilePicture,
				nickname,
			);
			if (newUser) {
				res.status(201).send(newUser);
			} else {
				res.status(500).send("Could not create user!");
			}
		} catch (error) {
			res.status(500).send("Could not create user!");
		}
	}

	async deleteUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const deletedUser = await userMethods.deleteUser(id);

			if (deletedUser) {
				res.status(202).send("User deleted!");
			} else {
				res.status(404).send("User not found!");
			}
		} catch (error) {
			res.status(500).send("Could not delete user!");
		}
	}

	async postFriendController(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.params.userId;
			const friendId = req.params.friendId;

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
			const { userId, friendId } = req.params;

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
			const { userId } = req.params;
			const users = await userMethods.findAllFriends(userId);
			res.status(200).send(users);
		} catch (error) {
			res.status(500).send("Could not fetch users!");
		}
	}
}

export default new UserController();
