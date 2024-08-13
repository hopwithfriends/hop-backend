import express from "express";
import spaceController from "../controllers/spaceController";

export const spaceRouter = express.Router();

// Basic
spaceRouter.post("/", spaceController.postSpace);
spaceRouter.delete("/:id", spaceController.deleteSpace);
spaceRouter.post("/addUser", spaceController.postUserToSpace);

// SpacesAllowed
spaceRouter.get("/myspaces", spaceController.getAdminSpaces);
spaceRouter.get("/invitedspaces", spaceController.getInvitedSpaces);

export default spaceRouter;
