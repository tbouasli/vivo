import "elastic-apm-node/start";

import Express from "express";
import { Pool } from "pg";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { hash, compare } from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = Express();

app.use(Express.json());

app.get("/health", (_, res) => {
  res.send("OK");
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/sign-up", async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = signUpSchema.parse(req.body);

    const hashedPassword = await hash(password, 10);

    const response = await client.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );

    const { id } = response.rows[0];

    const token = jwt.sign({ id }, process.env.JWT_SECRET!);

    return res.json({ token });
  } finally {
    client.release();
  }
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

app.post("/sign-in", async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = signInSchema.parse(req.body);

    const result = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    const user = result.rows[0];

    if (!user) {
      return res.json({ error: "User not found" }).status(401);
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return res.json({ error: "Invalid password" }).status(401);
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
    return res.json({ token });
  } finally {
    client.release();
  }
});

app.get("/my-products", async (req, res) => {
  const client = await pool.connect();

  try {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.json({ error: "Token not provided" }).status(401);
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.json({ error: "Invalid token" }).status(401);
    }

    const { id } = jwt.decode(token) as { id: string };

    const result = await client.query(
      `
    SELECT p.*
    FROM products p
    JOIN user_products up ON p.id = up.product_id
    WHERE up.user_id = $1
  `,
      [id]
    );

    const products = result.rows;

    return res.json({ products });
  } finally {
    client.release();
  }
});

app.post("/my-products/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token not provided" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { id } = jwt.decode(token) as { id: string };

    const productId = parseInt(req.params.id);

    await client.query(
      `
      INSERT INTO user_products (user_id, product_id)
      VALUES (
        (SELECT id FROM users WHERE id = $1),
        $2
      )
    `,
      [id, productId]
    );

    return res.json().status(201);
  } finally {
    client.release();
  }
});

app.delete("/my-products/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token not provided" });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { id } = jwt.decode(token) as { id: string };

    const productId = parseInt(req.params.id);

    await client.query(
      `
      DELETE FROM user_products
      WHERE user_id = (SELECT id FROM users WHERE id = $1)
      AND product_id = $2
    `,
      [id, productId]
    );

    return res.json().status(204);
  } finally {
    client.release();
  }
});

app.listen(80, () => {
  console.log("Server is running on port 80");
});
