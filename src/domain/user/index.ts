import { sign } from "../../utils/jwt";
import * as pg from "psychopiggy";
import { getPool, withTransaction } from "../../db";
export { createKeyValuePair } from "./kvStore";
export { createResource } from "./resource";
export { getRoles } from "./role";
export { getTokensForUser, getTokensByProviderCredentials } from "./token";

export async function getUserIdAvailability(
  userId: string
): Promise<{ exists: boolean }> {
  const pool = getPool();

  const params = new pg.Params({ id: userId });

  const { rows } = await pool.query(
    `SELECT id FROM "user" WHERE id=${params.id("id")}`,
    params.values()
  );

  return { exists: rows.length !== 0 };
}

export type GetUserIdResult =
  | {
      isValidUser: true;
      userId: string;
    }
  | { isValidUser: false };

export async function getUserId(
  providerUserId: string,
  provider: string
): Promise<GetUserIdResult> {
  const pool = getPool();

  const params = new pg.Params({
    providerUserId,
    provider
  });

  const { rows } = await pool.query(
    `SELECT user_id FROM "provider_user" WHERE provider_user_id=${params.id(
      "providerUserId"
    )} AND provider=${params.id("provider")}`,
    params.values()
  );

  return rows.length
    ? {
        isValidUser: true,
        userId: rows[0].user_id
      }
    : {
        isValidUser: false
      };
}

export type CreateUserResult =
  | {
      created: false;
      reason: string;
    }
  | {
      created: true;
      jwt: string;
      tokens: { [key: string]: string };
    };

export async function createUser(
  userId: string,
  providerUserId: string,
  provider: string
): Promise<CreateUserResult> {
  const getUserIdResult = await getUserId(providerUserId, provider);
  return getUserIdResult.isValidUser
    ? { created: false as false, reason: "User already exists." }
    : await (async () => {
        const txResult = await withTransaction(async client => {
          const insertUserParams = new pg.Params({
            id: userId,
            first_name: "NA",
            last_name: "NA",
            timestamp: Date.now()
          });

          await client.query(
            `INSERT INTO "user" (${insertUserParams.columns()}) VALUES (${insertUserParams.ids()})`,
            insertUserParams.values()
          );

          const insertProviderUserParams = new pg.Params({
            user_id: userId,
            provider_user_id: providerUserId,
            provider,
            timestamp: Date.now()
          });

          await client.query(
            `INSERT INTO "provider_user" (${insertProviderUserParams.columns()}) VALUES (${insertProviderUserParams.ids()})`,
            insertProviderUserParams.values()
          );

          return true;
        });

        return txResult.success
          ? {
              created: true as true,
              jwt: sign({ userId, providerUserId, provider }),
              tokens: { userId, providerUserId, provider }
            }
          : {
              created: false as false,
              reason: "Could not create the new user."
            };
      })();
}
