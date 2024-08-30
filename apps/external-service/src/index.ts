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

app.post("/products", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertProductQuery = `
      INSERT INTO products (name, price)
      VALUES ($1, $2)
      RETURNING id;
    `;
    const productRes = await client.query(insertProductQuery, [
      req.body.name,
      req.body.price,
    ]);
    const productId = productRes.rows[0].id;

    await client.query("COMMIT");
    res.send({ id: productId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.patch("/products/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateProductQuery = `
        UPDATE products
        SET name = $2, price = $3
        WHERE id = $1;
        `;
    await client.query(updateProductQuery, [
      req.params.id,
      req.body.name,
      req.body.price,
    ]);

    await client.query("COMMIT");
    res.send("OK");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.get("/products", async (req, res) => {
  const client = await pool.connect();

  try {
    const selectProductsQuery = `
        SELECT * FROM products;
        `;
    const productsRes = await client.query(selectProductsQuery);
    res.send(productsRes.rows);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.get("/products/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const selectProductQuery = `
                SELECT * FROM products WHERE id = $1;
                `;
    const productRes = await client.query(selectProductQuery, [req.params.id]);
    res.send(productRes.rows[0]);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.post("/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertOrderQuery = `
        INSERT INTO orders (product_id, quantity, status)
        VALUES ($1, $2, $3)
        RETURNING id;
        `;
    const orderRes = await client.query(insertOrderQuery, [
      req.body.product_id,
      req.body.quantity,
      req.body.status,
    ]);
    const orderId = orderRes.rows[0].id;

    await client.query("COMMIT");
    res.send({ id: orderId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.patch("/orders/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateOrderQuery = `
            UPDATE orders
            SET product_id = $2, quantity = $3, status = $4
            WHERE id = $1;
            `;
    await client.query(updateOrderQuery, [
      req.params.id,
      req.body.product_id,
      req.body.quantity,
      req.body.status,
    ]);

    await client.query("COMMIT");
    res.send("OK");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.get("/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const selectOrdersQuery = `
                SELECT * FROM orders;
                `;
    const ordersRes = await client.query(selectOrdersQuery);
    res.send(ordersRes.rows);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.get("/orders/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const selectOrderQuery = `
                        SELECT * FROM orders WHERE id = $1;
                        `;
    const orderRes = await client.query(selectOrderQuery, [req.params.id]);
    res.send(orderRes.rows[0]);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
