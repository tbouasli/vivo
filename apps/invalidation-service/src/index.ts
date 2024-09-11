import { Kafka } from "kafkajs";
import { Pool } from "pg";

const kafka = new Kafka({
  clientId: "cache-service",
  brokers: ["localhost:9092"], // Adjust this to your Kafka broker addresses
});
const consumer = kafka.consumer({ groupId: "cache-service-group" });

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cache",
  password: "postgres",
  port: 5432,
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
  await consumer.connect();
  await consumer.subscribe({ topic: "cache-invalidations", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
	  
	  if (!message.value) return;
     
      const { tagName } = JSON.parse(message.value.toString());
      console.log(`Invalidating tag: ${tagName}`);
      await invalidateTagRecursively(tagName);
    },
  });
};

run().catch(console.error);
