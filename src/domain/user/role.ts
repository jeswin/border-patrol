import * as pg from "psychopiggy";
import { getPool } from "../../db";

export async function getRoles(userId: string): Promise<string[]> {
  const pool = getPool();

  const params = new pg.Params({
    user_id: userId
  });

  const { rows } = await pool.query(
    `SELECT role_name FROM "user_role" WHERE user_id=${params.id("user_id")}`,
    params.values()
  );

  return rows.map(x => x.role_name);
}
