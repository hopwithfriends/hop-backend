import express from "express";
import Sentry from "@sentry/node";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
	res.send("Hi, welcome to Hop API!");
});

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
