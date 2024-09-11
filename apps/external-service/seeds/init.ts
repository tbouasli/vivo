import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("products").insert([
    { name: "VIVO Telefone", description: "Plano de telefone fixo da VIVO" },
    { name: "VIVO Internet", description: "Plano de internet da VIVO" },
    { name: "VIVO Celular", description: "Plano de celular da VIVO" },
  ]);

  await knex("users").insert([
    { name: "João", email: "joao@email.com" },
    { name: "Maria", email: "maria@email.com" },
  ]);

  await knex("user_products").insert([
    { user_id: 1, product_id: 1 },
    { user_id: 1, product_id: 2 },
    { user_id: 2, product_id: 3 },
  ]);
}
