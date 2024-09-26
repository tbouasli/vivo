import newrelic from "newrelic";

import { Pool } from "pg";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  endpoint: process.env.AWS_ENDPOINT,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const invalidateTagRecursively = async (tag: string) => {
  const client = await pool.connect();
  try {
    const selectTagIdQuery = `SELECT id FROM tags WHERE name = $1;`;
    const res = await client.query(selectTagIdQuery, [tag]);
    const tagId = res.rows.length > 0 ? res.rows[0].id : null;

    if (!tagId) return;

    const selectCacheIdsQuery = `SELECT cache_id FROM cache_tags WHERE tag_id = $1;`;
    const cacheIdsRes = await client.query(selectCacheIdsQuery, [tagId]);
    const cacheIds = cacheIdsRes.rows.map((row: any) => row.cache_id);

    if (cacheIds.length > 0) {
      const deleteCacheEntriesQuery = `
        DELETE FROM cache_entries WHERE key = ANY($1::text[]);
      `;
      await client.query(deleteCacheEntriesQuery, [cacheIds]);
    }

    const deleteCacheTagsQuery = `
      DELETE FROM cache_tags WHERE tag_id = $1;
    `;
    await client.query(deleteCacheTagsQuery, [tagId]);

    const deleteTagQuery = `DELETE FROM tags WHERE id = $1;`;
    await client.query(deleteTagQuery, [tagId]);

    const selectChildTagsQuery = `SELECT name FROM tags WHERE parent_id = $1;`;
    const childTagsRes = await client.query(selectChildTagsQuery, [tagId]);
    const childTags = childTagsRes.rows.map((row: any) => row.name);

    for (const childTag of childTags) {
      await invalidateTagRecursively(childTag);
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
};

const run = async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const command = new ReceiveMessageCommand({
    QueueUrl: process.env.QUEUE_URL,
    MaxNumberOfMessages: 10,
  });

  while (true) {
    const res = await sqs.send(command);
    if (res.Messages) {
      for (const message of res.Messages) {
        if (!message.Body) {
          continue;
        }

        let body = null;

        try {
          body = JSON.parse(message.Body);
        } catch (err) {
          console.error(err);
          continue;
        }

        const tag = body.tag;
        await invalidateTagRecursively(tag);

        const deleteCommand = new DeleteMessageCommand({
          QueueUrl: process.env.QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle,
        });
        await sqs.send(deleteCommand);
      }
    }
  }
};

run().catch(console.error);
