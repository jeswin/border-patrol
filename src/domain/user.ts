import { sign } from "../utils/jwt";
import * as pg from "psychopiggy";
import { getPool, withTransaction } from "../db";

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

export type getTokensForUserResult = { [key: string]: string };

export async function getTokensForUser(
  userId: string
): Promise<getTokensForUserResult> {
  const pool = getPool();

  const userTokenParams = new pg.Params({
    user_id: userId
  });

  const { rows: userTokenRows } = await pool.query(
    `SELECT name, value FROM user_token WHERE user_id=${userTokenParams.id(
      "user_id"
    )}`,
    userTokenParams.values()
  );

  const roles = await getRoles(userId);

  const roleTokenRows = roles.length
    ? await (async () => {
        const roleTokenParams = new pg.Params({
          ...roles
        });

        const { rows: roleTokenRows } = await pool.query(
          `SELECT name, value 
            FROM role_token 
            WHERE role_name IN (${roleTokenParams.ids()})`,
          roleTokenParams.values()
        );

        return roleTokenRows;
      })()
    : [];

  const tokens: { [key: string]: string } = userTokenRows
    .concat(roleTokenRows)
    .reduce((acc, i) => ((acc[i.name] = i.value), acc), {});

  const result = roles.length
    ? {
        userId,
        roles: roles.join(","),
        ...tokens
      }
    : {
        userId,
        ...tokens
      };

  return result;
}

export interface IGetTokensResult {
  isValidUser: boolean;
  jwt: string;
  tokens: { [key: string]: string };
}

export async function getTokensByProviderCredentials(
  providerUserId: string,
  provider: string
): Promise<IGetTokensResult> {
  const getUserIdResult = await getUserId(providerUserId, provider);

  return getUserIdResult.isValidUser
    ? await (async () => {
        const userId = getUserIdResult.userId;
        const tokensForUser = await getTokensForUser(userId);
        return {
          isValidUser: true,
          jwt: sign(tokensForUser),
          tokens: { ...tokensForUser, providerUserId, provider }
        };
      })()
    : {
        isValidUser: false,
        jwt: sign({ providerUserId, provider }),
        tokens: { providerUserId, provider }
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
  const getUserIdResult = await getUserIdAvailability(userId);
  return !getUserIdResult.exists
    ? { created: false as false, reason: "User does not exist." }
    : await (async () => {
        const txResult = await withTransaction(async client => {
          const params = new pg.Params({
            user_id: userId,
            key,
            value,
            tag,
            timestamp: Date.now()
          });

          await client.query(
            `INSERT INTO "user_store_log" (${params.columns()}) VALUES (${params.ids()})`,
            params.values()
          );

          const checkParams = new pg.Params({
            user_id: userId,
            key
          });

          // Check if the value exists.
          const { rowCount } = await client.query(
            `SELECT 1 FROM "user_store" WHERE user_id=${checkParams.id(
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
                  `UPDATE "user_store" 
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
                  `INSERT INTO "user_store" (${params.columns()}) VALUES (${params.ids()})`,
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
      })();
}
