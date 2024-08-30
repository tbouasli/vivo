import Express from "express";
import { getCache, invalidateTags, setCache } from "@vivo/cache";

const EXTERNAL_API_URL = "http://localhost:3000";

const app = Express();

app.get("/health", (_, res) => {
  res.send("OK");
});

app.post("/products", async (req, res) => {
  const response = await fetch(`${EXTERNAL_API_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.send(data);
  invalidateTags("products");
});

app.patch("/products/:id", async (req, res) => {
  const response = await fetch(
    `${EXTERNAL_API_URL}/products/${req.params.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    }
  );

  const data = await response.json();
  res.send(data);
  invalidateTags("products");
});

app.get("/products", async (_, res) => {
  const cache = await getCache("products");

  if (cache) {
    res.send(cache);
    return;
  }

  const response = await fetch(`${EXTERNAL_API_URL}/products`);
  const data = await response.json();

  await setCache("products", data, ["products"]);
  res.send(data);
});

app.get("/products/:id", async (req, res) => {
  const cache = await getCache(`products:${req.params.id}`);

  if (cache) {
    res.send(cache);
    return;
  }

  const response = await fetch(`${EXTERNAL_API_URL}/products/${req.params.id}`);
  const data = await response.json();

  await setCache(`products:${req.params.id}`, data, ["products"]);
  res.send(data);
});
