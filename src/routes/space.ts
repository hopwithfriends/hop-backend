import express from "express";
import spaceController from "../controllers/spaceController";

export const spaceRouter = express.Router();

// Basic
spaceRouter.post("/", spaceController.postSpace);
spaceRouter.delete("/:id", spaceController.deleteSpace);
spaceRouter.post("/addUser", spaceController.postUserToSpace);
spaceRouter.delete("/kick/:spaceId/:userId");

// SpacesAllowed
spaceRouter.get("/mySpaces", spaceController.getAdminSpaces);
spaceRouter.get("/invitedSpaces", spaceController.getInvitedSpaces);

export default spaceRouter;
