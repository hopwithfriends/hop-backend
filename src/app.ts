// import Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
import { authMiddleware } from "./authMiddleware";
import spaceController from "./controllers/spaceController";
import { authRouter } from "./routes/auth";
import spaceRouter from "./routes/space";
import userRouter from "./routes/user";
import { createServer } from "node:http";
import { Server } from "socket.io";
import userMethods from "./models/userMethods";
import { instrument } from "@socket.io/admin-ui";

const app = express();

const limiter = rateLimit({
	windowMs: 1000, // 1 second
	limit: 20,
	standardHeaders: "draft-7",
	legacyHeaders: false,
});
app.use(cors());
app.use(limiter);
app.use(express.json());

app.use((req, res, next) => {
	// Logging Middleware
	console.log("Request received at", new Date().toISOString());
	console.log("Request method:", req.method);
	console.log("Request URL:", req.url);
	console.log("Request body:", req.body);
	console.log("Request headers:", req.headers.referer);
	console.log("-----------------");
	next();
});

// No Auth Required
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/spaceId/:id", spaceController.getSpaceById);
app.get("/api", (req, res) => {
	res.send("Hi, welcome to Hop API!");
});

// Auth Protected
app.use(authMiddleware);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/space", spaceRouter);

// ! Setup SENTRY for deployment
/*
import "../instrument";
Sentry.setupExpressErrorHandler(app);
// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
	res.statusCode = 500;
	res.end(`${res.sentry} + \n`);
	});*/

const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["http://localhost:3000", "https://admin.socket.io"],
		methods: ["GET", "POST"],
		credentials: true,
	},
});

instrument(io, {
	auth: false,
	mode: "development",
});

const connectedUsers = new Map();

// Add to Database & Connected Users Map
async function addUser(userId: string, socketId: string) {
	if (connectedUsers.has(userId)) {
		connectedUsers.delete(userId);
	}
	connectedUsers.set(userId, socketId);
	await userMethods.changeStatus(userId);
}

// Remove from DB & Connected Users Map
async function deleteUser(userId: string) {
	await userMethods.changeStatus(userId, false);
	connectedUsers.delete(userId);
}

async function checkOnlineFriends(userId: string) {
	const friends = await userMethods.findAllFriends(userId);
	const friendsIdArray = friends.map((friend) => friend.id);
	const connectedUsersArray = Array.from(
		connectedUsers,
		([userId, socketId]) => ({
			userId,
			socketId,
		}),
	);
	const onlineFriends = connectedUsersArray.filter((friend) =>
		friendsIdArray.includes(friend.userId),
	);
	return onlineFriends;
}

io.use(async (socket, next) => {
	const socketId = socket.id;
	const userId = socket.handshake.auth.token;
	await addUser(userId, socketId);
	const onlineFriends = await checkOnlineFriends(userId);
	if (onlineFriends) {
		io.emit("online_friends", "updated");
	}
	console.log(`WSS - Connected: ${userId}`);
	console.log("Online Friends: ", onlineFriends);
	next();
});

io.on("connection", (socket) => {
	socket.on("space", (arg) => {
		// Implement move into Space
	});

	socket.on("disconnect", async (arg) => {
		const userId = socket.handshake.auth.token;
		const onlineFriends = await checkOnlineFriends(userId);
		if (onlineFriends) {
			io.emit("online_friends", "updated");
		}
		await deleteUser(userId);
		console.log(`WSS - Disconnected: ${userId}`);
		console.log(`WSS - Connected Users: ${connectedUsers}`);
	});
});

export default server;
