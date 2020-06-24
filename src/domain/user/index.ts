import { sign } from "../../utils/jwt";
import * as pg from "psychopiggy";
import { getPool, withTransaction } from "../../db";
import { PoolClient } from "pg";
import * as configModule from "../../config";

export { getRoles } from "./role";
export { createKeyValuePair } from "../user/kvstore";
export { getTokensForUser, getJwtAndTokensByProviderIdentity } from "./token";

export async function getUserIdAvailability(
  userId: string
): Promise<{ available: boolean }> {
  return userId
    ? await (async () => {
        const config = configModule.get();

        return config.account &&
          config.account.minUserIdLength &&
          userId.length < config.account.minUserIdLength
          ? {
              available: false,
            }
          : config.account &&
            config.account.maxUserIdLength &&
            userId.length > config.account.maxUserIdLength
          ? {
              available: false,
            }
          : await (async () => {
              const pool = getPool();
              const params = new pg.Params({ id: userId });

              const { rows } = await pool.query(
                `SELECT id FROM "user" WHERE id=${params.id("id")}`,
                params.values()
              );

              return {
                available: rows.length === 0,
              };
            })();
      })()
    : {
        available: false,
      };
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
    provider,
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
        userId: rows[0].user_id,
      }
    : {
        isValidUser: false,
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
  return userId && providerUserId && provider
    ? await (async () => {
        const config = configModule.get();

        const minUserIdLength = config.account?.minUserIdLength;
        const maxUserIdLength = config.account?.maxUserIdLength;
        
        return minUserIdLength && userId.length < minUserIdLength
          ? {
              created: false as false,
              reason: `UserId should be at least ${minUserIdLength} characters long.`,
            }
          : maxUserIdLength && userId.length > maxUserIdLength
          ? {
              created: false as false,
              reason: `UserId should be at most ${maxUserIdLength} characters long.`,
            }
          : await (async () => {
              const getUserIdResult = await getUserId(providerUserId, provider);
              return getUserIdResult.isValidUser
                ? { created: false as false, reason: "User already exists." }
                : await (async () => {
                    const txResult = await withTransaction((client) =>
                      insertUserIntoDb(userId, providerUserId, provider, client)
                    );

                    return txResult.success
                      ? {
                          created: true as true,
                          jwt: sign({ userId, providerUserId, provider }),
                          tokens: { userId, providerUserId, provider },
                        }
                      : {
                          created: false as false,
                          reason: "Could not create the new user.",
                        };
                  })();
            })();
      })()
    : {
        created: false as false,
        reason: "Missing parameters.",
      };
}

export async function deleteUser(userId: string) {
  const pool = getPool();

  const params = new pg.Params({
    user_id: userId,
  });

  await withTransaction(async (client) => {
    await client.query(
      `DELETE FROM "local_user_auth" WHERE user_id=${params.id("user_id")}`,
      params.values()
    );

    await client.query(
      `DELETE FROM "provider_user" WHERE user_id=${params.id("user_id")}`,
      params.values()
    );

    await client.query(
      `DELETE FROM "user_token" WHERE user_id=${params.id("user_id")}`,
      params.values()
    );

    await client.query(
      `DELETE FROM "user_role" WHERE user_id=${params.id("user_id")}`,
      params.values()
    );

    await client.query(
      `DELETE FROM "kvstore" WHERE user_id=${params.id("user_id")}`,
      params.values()
    );

    await client.query(
      `DELETE FROM "user" WHERE id=${params.id("user_id")}`,
      params.values()
    );
  });
}

export async function insertUserIntoDb(
  userId: string,
  providerUserId: string,
  provider: string,
  client: PoolClient
) {
  const insertUserParams = new pg.Params({
    id: userId,
    name: userId,
    status: "active",
    timestamp: Date.now(),
  });

  await client.query(
    `INSERT INTO "user" (${insertUserParams.columns()}) VALUES (${insertUserParams.ids()})`,
    insertUserParams.values()
  );

  const insertProviderUserParams = new pg.Params({
    user_id: userId,
    provider_user_id: providerUserId,
    provider,
    timestamp: Date.now(),
  });

  await client.query(
    `INSERT INTO "provider_user" (${insertProviderUserParams.columns()}) VALUES (${insertProviderUserParams.ids()})`,
    insertProviderUserParams.values()
  );
}
