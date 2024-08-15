// import Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
import { authMiddleware } from "./authMiddleware";
import spaceController from "./controllers/spaceController";
import { authRouter } from "./routes/auth";
import spaceRouter from "./routes/space";
import userRouter from "./routes/user";
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
	// Logging Middleware
	console.log("Request received at", new Date().toISOString());
	console.log("Request method:", req.method);
	console.log("Request URL:", req.url);
	console.log("Request body:", req.body);
	console.log("Request headers:", req.headers.referer);
	console.log("---");
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

export default app;
