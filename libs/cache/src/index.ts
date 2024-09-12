import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function setCache(
  key: string,
  value: string,
  tags: string[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertCacheQuery = `
      INSERT INTO cache_entries (key, value) 
      VALUES ($1, $2) 
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;
    await client.query(insertCacheQuery, [key, value]);

    for (const tag of tags) {
      const insertTagQuery = `
        INSERT INTO tags (name) 
        VALUES ($1) 
        ON CONFLICT (name) DO NOTHING 
        RETURNING id;
      `;
      let tagIdRes = await client.query(insertTagQuery, [tag]);
      let tagId = tagIdRes.rows.length > 0 ? tagIdRes.rows[0].id : null;

      if (!tagId) {
        const selectTagQuery = `SELECT id FROM tags WHERE name = $1;`;
        tagIdRes = await client.query(selectTagQuery, [tag]);
        tagId = tagIdRes.rows[0].id;
      }

      const insertCacheTagQuery = `
        INSERT INTO cache_tags (cache_id, tag_id) 
        VALUES ($1, $2) 
        ON CONFLICT DO NOTHING;
      `;
      await client.query(insertCacheTagQuery, [key, tagId]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getCache(key: string): Promise<string | null> {
  const client = await pool.connect();
  try {
    const selectQuery = `
      SELECT value FROM cache_entries WHERE key = $1;
    `;
    const res = await client.query(selectQuery, [key]);
    return res.rows.length > 0 ? res.rows[0].value : null;
  } finally {
    client.release();
  }
}

export async function invalidateTags(tagName: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invalidateTagRecursively = async (tag: string) => {
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
    };

    await invalidateTagRecursively(tagName);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function invalidateCache(key: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const deleteCacheEntriesQuery = `
      DELETE FROM cache_entries WHERE key = $1;
    `;
    await client.query(deleteCacheEntriesQuery, [key]);

    const selectTagIdQuery = `SELECT id FROM tags WHERE name = $1;`;
    const res = await client.query(selectTagIdQuery, [key]);
    const tagId = res.rows.length > 0 ? res.rows[0].id : null;

    if (tagId) {
      const deleteCacheTagsQuery = `
        DELETE FROM cache_tags WHERE tag_id = $1;
      `;
      await client.query(deleteCacheTagsQuery, [tagId]);

      const deleteTagQuery = `DELETE FROM tags WHERE id = $1;`;
      await client.query(deleteTagQuery, [tagId]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
