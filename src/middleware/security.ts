import { Request, Response, NextFunction } from "express";
import aj from "../config/arcjet";
import { ArcjetNodeRequest, slidingWindow } from "@arcjet/node";

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  try {
    const role: RateLimitRole = req.user?.role || "guest";

    let limit: number;
    let message: string;

    switch (role) {
      case "admin":
        limit = 20;
        message = "Admin rate limit exceeded. Please try again later.";
        break;
      case "teacher":
      case "student":
        limit = 10;
        message =
          "Student or teacher rate limit exceeded. Please try again later.";
        break;
      default:
        limit = 5;
        message = "Guest rate limit exceeded. Please try again later.";
    }

    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: limit,
      }),
    );

    const arcjetRequest: ArcjetNodeRequest = {
      headers: req.headers,
      method: req.method,
      url: req.originalUrl ?? req.url,
      socket: {
        remoteAddress: req.socket.remoteAddress ?? req?.ip ?? "0.0.0.0",
      },
    };

    const desicion = await client.protect(arcjetRequest);

    if (desicion.isDenied() && desicion.reason.isBot()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are not allowed.",
      });
    }
    if (desicion.isDenied() && desicion.reason.isShield()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Request block by security policy.",
      });
    }
    if (desicion.isDenied() && desicion.reason.isRateLimit()) {
      return res.status(403).json({
        error: "Too many requests",
        message: message,
      });
    }

    next();
  } catch (error) {
    console.log("Security Middleware Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while processing your request.",
    });
  }
};

export default securityMiddleware;
