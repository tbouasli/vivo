CREATE TABLE cache_entries (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    parent_id INT REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE cache_tags (
    cache_id VARCHAR(255) REFERENCES cache_entries(key) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (cache_id, tag_id)
);