import express from "express";
import userController from "../controllers/userController";
export const userRouter = express.Router();

<<<<<<< Updated upstream
//Basic
<<<<<<< Updated upstream
// userRouter.get("/", userController.getAllUsers);
userRouter.get("/", userController.getOneUser);
// userRouter.post("/", userController.postUser);
// userRouter.delete("/:id", userController.deleteUser);
=======
userRouter.get("/", userController.getAllUsers);
userRouter.get("/:id", userController.getOneUser);
userRouter.post("/", userController.postUser);
userRouter.delete("/:id", userController.deleteUser);
=======
// Basic
userRouter.get("/", userController.getOneUser);
userRouter.post("/", userController.postFriendController);
>>>>>>> Stashed changes
>>>>>>> Stashed changes

// Friend
userRouter.post("/friend/:friendId", userController.postFriendController);
userRouter.delete("/friend/:friendId", userController.deleteFriendController);
userRouter.get("/friend", userController.getAllFriends);

export default userRouter;
