import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      extension: "ts",
      directory: "./migrations",
    },
    seeds: {
      extension: "ts",
      directory: "./seeds",
    },
  },
};

export default config;
