import type { Request, Response } from "express";
import spaceMethods from "../models/spaceMethods";

class SpaceController {
	async postSpace(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const { id, name, password, theme } = req.body;
			const newSpace = await spaceMethods.insertSpace(
				id,
				name,
				userId,
				password,
				theme,
			);
			if (newSpace) {
				res.status(201).send(newSpace);
			} else {
				res.status(400).send("Could not create space!");
			}
		} catch (error) {
			res.status(500).send("Could not create space!");
		}
	}

	async deleteSpace(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const { id } = req.params;
			const deletedSpace = await spaceMethods.deleteSpace(id, userId);
			if (deletedSpace) {
				res.status(202).send("Space deleted!");
			} else {
				res.status(400).send("Space not found!");
			}
		} catch (error) {
			res.status(500).send("Could not delete space!");
		}
	}

	async postUserToSpace(req: Request, res: Response): Promise<void> {
		try {
			const { spaceId, friendId, role } = req.body;
			const addedMember = await spaceMethods.addUserToSpace(
				spaceId,
				friendId,
				role,
			);

			if (addedMember) {
				res.status(201).send("Removed user!");
			} else {
				res.status(400).send("Could not remove user from space!");
			}
		} catch (error) {
			res.status(500).send("Could not remove user from space!");
		}
	}

	async deleteUserFromSpace(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { spaceId, userId } = req.params;
			const removedMember = await spaceMethods.removeUserFromSpace(
				spaceId,
				id,
				userId,
			);
			if (removedMember) {
				res.status(201).send(removedMember);
			} else {
				res.status(400).send("Could not add user to space!");
			}
		} catch (error) {
			res.status(500).send("Could not add user to space!");
		}
	}

	async getAdminSpaces(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const adminSpaces = await spaceMethods.findOwnedSpaces(userId);
			res.status(200).send(adminSpaces);
		} catch (error) {
			res.status(500).send("Could not fetch your spaces!");
		}
	}

	async getInvitedSpaces(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user;
			const memberSpaces = await spaceMethods.findInvitedSpaces(userId);
			res.status(200).send(memberSpaces);
		} catch (error) {
			res.status(500).send("Could not fetch your invited spaces!");
		}
	}

	async getSpaceById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const spaceFound = await spaceMethods.findSpace(id);
			if (spaceFound) {
				res.status(200).send(spaceFound);
			} else {
				res.status(400).send("Space not found!");
			}
		} catch (error) {
			res.status(500).send("Server failed to fetch space!");
		}
	}
}

export default new SpaceController();
