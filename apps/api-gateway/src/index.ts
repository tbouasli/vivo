import Express from "express";
import { getCache, invalidateTags, setCache } from "@vivo/cache";

const EXTERNAL_API_URL = "http://localhost:8080";

const app = Express();

app.get("/health", (_, res) => {
  res.send("OK");
});

app.post("/sign-up", async (req, res) => {
  const response = await fetch(`${EXTERNAL_API_URL}/sign-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.send(data);
});

app.post("/sign-in", async (req, res) => {
  const response = await fetch(`${EXTERNAL_API_URL}/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  res.send(data);
});

app.post("/my-products/:id", async (req, res) => {
  const response = await fetch(
    `${EXTERNAL_API_URL}/my-products/${req.params.id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization!,
      },
      body: JSON.stringify(req.body),
    }
  );

  const data = await response.json();
  res.send(data);
  invalidateTags(req.headers.authorization!);
});

app.delete("/my-products/:id", async (req, res) => {
  const response = await fetch(
    `${EXTERNAL_API_URL}/my-products/${req.params.id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization!,
      },
    }
  );

  const data = await response.json();
  res.send(data);
  invalidateTags(req.headers.authorization!);
});

app.get("/my-products", async (req, res) => {
  const cachedProducts = await getCache(req.headers.authorization!);

  if (cachedProducts) {
    console.log("Cache hit");
    res.send(cachedProducts);
    return;
  } else {
    console.log("Cache miss");
  }

  const response = await fetch(`${EXTERNAL_API_URL}/my-products`, {
    headers: {
      Authorization: req.headers.authorization!,
    },
  });

  console.log(response.body);
  const data = await response.json();

  setCache(req.headers.authorization!, data, [
    "my-products",
    req.headers.authorization!,
  ]);
  res.send(data);
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
