import type { Request, Response } from "express";
import spaceMethods from "../models/spaceMethods";

class SpaceController {

  async postSpace(req: Request, res: Response): Promise<void> {
    try {
      const { name, flyUrl,  userId , theme } = req.body;
      const newSpace = await spaceMethods.insertSpace(name, flyUrl, userId, theme);
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
      const { id } = req.params;
      const deletedSpace = await spaceMethods.deleteSpace(id);

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
      const { spaceId, userId, role } = req.body;
      const addedMember = await spaceMethods.addUserToSpace(spaceId, userId, role);

      if (addedMember) {
        res.status(201).send(addedMember);
      } else {
        res.status(400).send("Could not add user to space!");
      }
    } catch (error) {
      res.status(500).send("Could not add user to space!");
    }
  }

  async getAdminSpaces(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminSpaces = await spaceMethods.findOwnedSpaces(userId);
      res.status(200).send(adminSpaces);
    } catch (error) {
      res.status(500).send("Could not fetch your spaces!");
    }
  }

  async getInvitedSpaces(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const memberSpaces = await spaceMethods.findInvitedSpaces(userId);
      res.status(200).send(memberSpaces);
    } catch (error) {
      res.status(500).send("Could not fetch your invited spaces!");
    }
  }

}

export default new SpaceController();