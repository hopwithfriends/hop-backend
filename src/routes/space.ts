import express from "express";
import spaceController from "../controllers/spaceController";

export const spaceRouter = express.Router();

// Basic
spaceRouter.post("/", spaceController.postSpace);
spaceRouter.delete("/:id", spaceController.deleteSpace);

// Requests
spaceRouter.post("/request", spaceController.postSpaceRequest);
spaceRouter.post("/request/:requestId", spaceController.postAcceptSpaceRequest);
spaceRouter.delete("/request/:requestId", spaceController.deleteSpaceRequest);
spaceRouter.get("/request", spaceController.getAllSpaceRequests);

spaceRouter.delete(
	"/kick/:spaceId/:userId",
	spaceController.deleteUserFromSpace,
);

// SpacesAllowed
spaceRouter.get("/mySpaces", spaceController.getAdminSpaces);
spaceRouter.get("/invitedSpaces", spaceController.getInvitedSpaces);

export default spaceRouter;
