import * as pg from "psychopiggy";
import { withTransaction } from "../../db";

export type CreateKeyValuePairResult =
  | {
      created: false;
      reason: string;
    }
  | {
      created: true;
      edit: "update" | "insert";
    };

export async function createKeyValuePair(
  userId: string,
  key: string,
  value: string,
  tag: string
): Promise<CreateKeyValuePairResult> {
  const txResult = await withTransaction(async client => {
    const params = new pg.Params({
      user_id: userId,
      key,
      value,
      tag,
      timestamp: Date.now()
    });

    const checkParams = new pg.Params({
      user_id: userId,
      key
    });

    // Check if the value exists.
    const { rowCount } = await client.query(
      `SELECT 1 FROM "kvstore" WHERE user_id=${checkParams.id(
        "user_id"
      )} AND key=${checkParams.id("key")} LIMIT 1`,
      checkParams.values()
    );

    return rowCount > 0
      ? await (async () => {
          const updateParams = new pg.Params({
            user_id: userId,
            key,
            value,
            tag
          });

          await client.query(
            `UPDATE "kvstore" 
              SET ${updateParams.pairs(["value", "tag"])}
              WHERE
                ${checkParams.pair("user_id")} AND ${checkParams.pair(
              "key"
            )}                    `,
            updateParams.values()
          );

          return { created: true as true, edit: "update" as "update" };
        })()
      : await (async () => {
          await client.query(
            `INSERT INTO "kvstore" (${params.columns()}) VALUES (${params.ids()})`,
            params.values()
          );
          return { created: true as true, edit: "insert" as "insert" };
        })();
  });
  return txResult.success
    ? txResult.value
    : {
        created: false as false,
        reason: "Unable to insert key and value."
      };
}
