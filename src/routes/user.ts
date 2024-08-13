import express from "express";
import userController from "../controllers/userController";
export const userRouter = express.Router();

// Basic
userRouter.get("/", userController.getOneUser);
userRouter.put("/", userController.putUser);

// Friend
userRouter.post("/friend/:friendId", userController.postFriendController);
userRouter.delete("/friend/:friendId", userController.deleteFriendController);
userRouter.get("/friend", userController.getAllFriends);

export default userRouter;
