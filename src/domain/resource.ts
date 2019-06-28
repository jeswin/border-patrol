import * as pg from "psychopiggy";
import { getUserIdAvailability } from "./user";
import { withTransaction } from "../db";

export type CreateResourceResult =
  | {
      created: false;
      reason: string;
    }
  | {
      created: true;
    };

export async function createResource(
  userId: string,
  name: string
): Promise<CreateResourceResult> {
  const getUserIdResult = await getUserIdAvailability(userId);
  return !getUserIdResult.exists
    ? { created: false as false, reason: "User does not exist." }
    : await (async () => {
        const txResult = await withTransaction(async client => {
          const checkParams = new pg.Params({
            user_id: userId,
            name
          });

          // Check if the value exists.
          const { rowCount } = await client.query(
            `SELECT 1 FROM "user_resource" WHERE user_id=${checkParams.id(
              "user_id"
            )} AND name=${checkParams.id("name")} LIMIT 1`,
            checkParams.values()
          );

          return rowCount > 0
            ? {
                created: false as false,
                reason: "Resource already exists."
              }
            : await (async () => {
                const params = new pg.Params({
                  user_id: userId,
                  name,
                  timestamp: Date.now()
                });

                await client.query(
                  `INSERT INTO "user_resource" (${params.columns()}) VALUES (${params.ids()})`,
                  params.values()
                );
                return { created: true as true };
              })();
        });
        return txResult.success
          ? txResult.value
          : {
              created: false as false,
              reason: "Unable to create resource."
            };
      })();
}
