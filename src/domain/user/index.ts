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
  const config = configModule.get();

  return config.account &&
    config.account.minUserIdLength &&
    userId.length < config.account.minUserIdLength
    ? {
        created: false as false,
        reason:
          "UserId should be at least ${config.account.minLength} characters long.",
      }
    : config.account &&
      config.account.maxUserIdLength &&
      userId.length > config.account.maxUserIdLength
    ? {
        created: false as false,
        reason:
          "UserId should be at most ${config.account.maxLength} characters long.",
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

  return true;
}
