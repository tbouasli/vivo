import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name");
    table.string("email");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("name");
    table.string("description");
  });

  await knex.schema.createTable("user_products", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users");
    table.integer("product_id").unsigned().references("id").inTable("products");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_products");
  await knex.schema.dropTable("products");
  await knex.schema.dropTable("users");
}
