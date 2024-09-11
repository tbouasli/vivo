import Express, { NextFunction, Request, Response } from "express";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "external",
  password: "postgres",
  port: 5432,
});

const app = Express();

const delayMiddleware = (req: Request, res: Response, next: NextFunction) => {
  setTimeout(() => next(), 5000);
};

app.use(Express.json());
app.use(delayMiddleware);

app.get("/health", (_, res) => {
  res.send("OK");
});

app.get("/user/