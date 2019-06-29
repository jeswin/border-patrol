import * as pg from "psychopiggy";
import { getUserIdAvailability } from "./user";
import { withTransaction } from "../db";
import { generate } from "../utils/random";

export type CreateResourceResult =
  | {
      created: false;
      reason: string;
    }
  | {
      created: true;
      id: string;
    };

export async function createResource(
  userId: string
): Promise<CreateResourceResult> {
  const pool = await pg.getPool();
  const id = generate();
  const params = new pg.Params({
    id,
    timestamp: Date.now()
  });

  await pool.query(
    `INSERT INTO "resource" (${params.columns()}) VALUES (${params.ids()})`,
    params.values()
  );

  const permissionParams = new pg.Params({
    resource_id: id,
    user_id: userId,
    read: "Y",
    write: "Y",
    execute: "Y",
    timestamp: Date.now()
  });

  // Assign full permissions to the creator.
  await pool.query(
    `INSERT INTO "resource_permission" (${permissionParams.columns()}) VALUES (${permissionParams.ids()})`,
    permissionParams.values()
  );

  return { created: true as true, id };
}
