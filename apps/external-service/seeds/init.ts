import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("products").insert([
    { name: "VIVO Telefone", description: "Plano de telefone fixo da VIVO" },
    { name: "VIVO Internet", description: "Plano de internet da VIVO" },
    { name: "VIVO Celular", description: "Plano de celular da VIVO" },
  ]);
}
