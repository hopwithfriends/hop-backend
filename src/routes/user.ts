import express from "express";
import userController from "../controllers/userController";
export const userRouter = express.Router();
import multer from "multer";
// Multer for images
export const upload = multer({ storage: multer.memoryStorage() });

// Basic
userRouter.get("/", userController.getOneUser);
userRouter.put("/", upload.single("profilePicture"), userController.putUser);

// Friend
userRouter.post("/friend/:username", userController.postFriendController);
userRouter.delete("/friend/:friendId", userController.deleteFriendController);
userRouter.get("/friend", userController.getAllFriends);

export default userRouter;
