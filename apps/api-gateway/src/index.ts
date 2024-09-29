import apm from "elastic-apm-node/start";

import Express from "express";
import cors from "cors";
import { getCache, setCache } from "@vivo/cache";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  endpoint: process.env.AWS_ENDPOINT,
});

const app = Express();

app.use(cors());
app.use(Express.json());

app.get("/health", (_, res) => {
  return res.send("OK");
});

app.post("/sign-up", async (req, res) => {
  const response = await fetch(`${process.env.EXTERNAL_API_URL}/sign-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.send(data);
});

app.post("/sign-in", async (req, res) => {
  const response = await fetch(`${process.env.EXTERNAL_API_URL}/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.send(data);
});

app.post("/my-products/:id", async (req, res) => {
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/my-products/${req.params.id}`,
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
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify({ tag: req.headers.authorization! }),
      MessageAttributes: {
        traceparent: {
          DataType: "String",
          StringValue: apm.currentTraceparent!,
        },
      },
    })
  );

  return res.send(data);
});

app.delete("/my-products/:id", async (req, res) => {
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/my-products/${req.params.id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.authorization!,
      },
    }
  );

  const data = await response.json();
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify({ tag: req.headers.authorization! }),
      MessageAttributes: {
        traceparent: {
          DataType: "String",
          StringValue: apm.currentTraceparent!,
        },
      },
    })
  );

  return res.send(data);
});

app.get("/my-products", async (req, res) => {
  const cachedProducts = await getCache(req.headers.authorization!);

  if (cachedProducts) {
    console.log("Cache hit");
    return res.send(cachedProducts);
  } else {
    console.log("Cache miss");
  }

  const response = await fetch(`${process.env.EXTERNAL_API_URL}/my-products`, {
    headers: {
      Authorization: req.headers.authorization!,
    },
  });

  const data = await response.json();

  setCache(req.headers.authorization!, data, [
    "my-products",
    req.headers.authorization!,
  ]);
  return res.send(data);
});

app.listen(80, () => {
  console.log("Server running on port 80");
});
