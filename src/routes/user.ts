import express from "express";
import userController from "../controllers/userController";
export const userRouter = express.Router();

//Basic
// userRouter.get("/", userController.getAllUsers);
userRouter.get("/", userController.getOneUser);
// userRouter.post("/", userController.postUser);
// userRouter.delete("/:id", userController.deleteUser);

//Friend
userRouter.post(
	"/friend/:userId/:friendId",
	userController.postFriendController,
);
userRouter.delete(
	"/friend/:userId/:friendId",
	userController.deleteFriendController,
);

userRouter.get("/friend/:userId", userController.getAllFriends);

export default userRouter;
