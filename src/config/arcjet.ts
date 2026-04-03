import { shield } from "@arcjet/node";
import arcjet, { detectBot, slidingWindow } from "@arcjet/node";

if (!process.env.ARCJET_KEY && process.env.ARCJET_ENV !== "test") {
  throw new Error("ARCJET_KEY is not set in .env file");
}

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "2s",
      max: 5,
    }),
  ],
});

export default aj;
