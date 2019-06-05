import { sign } from "../utils/jwt";
import * as pg from "psychopiggy";
import { getPool, withTransaction } from "../db";

export async function getUsernameAvailability(
  username: string
): Promise<{ exists: boolean }> {
  const pool = getPool();

  const params = new pg.Params({ username });

  const { rows } = await pool.query(
    `SELECT username FROM "user" WHERE username=${params.id("username")}`,
    params.values()
  );

  return { exists: rows.length !== 0 };
}

export type GetUsernameResult =
  | {
      isValidUser: true;
      username: string;
    }
  | { isValidUser: false };

export async function getUsername(
  providerUsername: string,
  provider: string
): Promise<GetUsernameResult> {
  const pool = getPool();

  const params = new pg.Params({
    providerUsername,
    provider
  });

  const { rows } = await pool.query(
    `SELECT username FROM "provider_user" WHERE provider_username=${params.id(
      "providerUsername"
    )} AND provider=${params.id("provider")}`,
    params.values()
  );

  return rows.length
    ? {
        isValidUser: true,
        username: rows[0].username
      }
    : {
        isValidUser: false
      };
}

export async function getRoles(username: string): Promise<string[]> {
  const pool = getPool();

  const params = new pg.Params({
    username
  });

  const { rows } = await pool.query(
    `SELECT role FROM "user_role" WHERE username=${params.id("username")}`,
    params.values()
  );

  return rows.map(x => x.role);
}

export type getTokensForUserResult = { [key: string]: string };

export async function getTokensForUser(
  username: string,
  providerUsername: string,
  provider: string
): Promise<getTokensForUserResult> {
  const pool = getPool();

  const userTokenParams = new pg.Params({
    username
  });

  const { rows: userTokenRows } = await pool.query(
    `SELECT token, value FROM user_token WHERE username=${userTokenParams.id(
      "username"
    )}`,
    userTokenParams.values()
  );

  const roles = await getRoles(username);

  const roleTokenRows = roles.length
    ? await (async () => {
        const roleTokenParams = new pg.Params({
          ...roles
        });

        const { rows: roleTokenRows } = await pool.query(
          `SELECT token, value 
            FROM role_token 
            WHERE role IN (${roleTokenParams.ids()})`,
          roleTokenParams.values()
        );

        return roleTokenRows;
      })
    : [];

  const tokens: { [key: string]: string } = userTokenRows
    .concat(roleTokenRows)
    .reduce((acc, i) => ((acc[i.token] = i.value), acc), {});

  return {
    username,
    providerUsername,
    provider,
    roles: roles.join(","),
    ...tokens
  };
}

export interface IGetTokensResult {
  isValidUser: boolean;
  jwt: string;
  tokens: { [key: string]: string };
}

export async function getTokens(
  providerUsername: string,
  provider: string
): Promise<IGetTokensResult> {
  const getUsernameResult = await getUsername(providerUsername, provider);

  return getUsernameResult.isValidUser
    ? await (async () => {
        const username = getUsernameResult.username;
        const tokensForUser = await getTokensForUser(
          username,
          providerUsername,
          provider
        );
        return {
          isValidUser: true,
          jwt: sign(tokensForUser),
          tokens: tokensForUser
        };
      })()
    : {
        isValidUser: false,
        jwt: sign({ providerUsername, provider }),
        tokens: { providerUsername, provider }
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
  username: string,
  providerUsername: string,
  provider: string
): Promise<CreateUserResult> {
  const getUsernameResult = await getUsername(providerUsername, provider);
  return getUsernameResult.isValidUser
    ? { created: false as false, reason: "User already exists." }
    : await (async () => {
        const committed = await withTransaction(async client => {
          const insertUserParams = new pg.Params({
            username,
            first_name: "NA",
            last_name: "NA",
            created_at: Date.now(),
            updated_at: Date.now()
          });

          await client.query(
            `INSERT INTO "user" (${insertUserParams.columns()}) VALUES (${insertUserParams.ids()})`,
            insertUserParams.values()
          );

          const insertProviderUserParams = new pg.Params({
            username,
            provider_username: providerUsername,
            provider,
            created_at: Date.now(),
            updated_at: Date.now()
          });

          await client.query(
            `INSERT INTO "provider_user" (${insertProviderUserParams.columns()}) VALUES (${insertProviderUserParams.ids()})`,
            insertProviderUserParams.values()
          );

          return true;
        });

        return committed
          ? {
              created: true as true,
              jwt: sign({ username, providerUsername, provider, roles: "" }),
              tokens: { username, providerUsername, provider, roles: "" }
            }
          : {
              created: false as false,
              reason: "Could not create the new user."
            };
      })();
}
