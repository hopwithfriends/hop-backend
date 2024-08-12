import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";
import type { StackWebhookDataType } from "./types";

dotenv.config();

const STACK_API = "https://api.stack-auth.com/v1/api/users/me";

type StackHeadersType = {
	"x-stack-access-type": string;
	"x-stack-project-id": string;
	"x-stack-server-secret": string;
	"x-stack-access-token": string;
	"x-stack-refresh-token": string;
};

export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const publicEndpoints = ["/api/auth", "/api", "/api-docs"];
	if (publicEndpoints.includes(req.url)) next();

	const accessToken = req.headers["x-stack-access-token"];
	const refreshToken = req.headers["x-stack-refresh-token"];
	if (typeof accessToken === "string" && typeof refreshToken === "string") {
		const stackHeaders = generateStackHeaders(accessToken, refreshToken);
		if (!stackHeaders) {
			res.sendStatus(500);
			return;
		}

		const isAuthenticated = await authenticateUser(stackHeaders);
		if (!isAuthenticated) {
			res.sendStatus(403);
			return;
		}
		req.user = isAuthenticated;
		console.log(req.user);
		next();
	} else {
		res.sendStatus(500);
	}
};

const generateStackHeaders = (
	accessToken: string,
	refreshToken: string,
): StackHeadersType | null => {
	const projectId = process.env.PROJECT_ID;
	const serverSecretKey = process.env.SERVER_SECRET_KEY;

	if (projectId && serverSecretKey) {
		return {
			"x-stack-access-type": "server",
			"x-stack-project-id": projectId,
			"x-stack-server-secret": serverSecretKey,
			"x-stack-access-token": accessToken,
			"x-stack-refresh-token": refreshToken,
		};
	}
	throw new Error("Ensure STACK-AUTH environment variables are configured");
};

const authenticateUser = async (
	stackHeaders: StackHeadersType,
): Promise<string | null> => {
	const response = await fetch(STACK_API, { headers: stackHeaders });
	const isValidated: StackWebhookDataType = await response.json();
	if (isValidated.id) {
		return isValidated.id;
	}
	return null;
};
