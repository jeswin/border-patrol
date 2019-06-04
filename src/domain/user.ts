import { sign } from "./jwt";
import * as pg from "psychopiggy";
import { getPool } from "../db";

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

  const roleTokenParams = new pg.Params({
    ...roles
  });

  const { rows: roleTokenRows } = await pool.query(
    `SELECT token, value 
      FROM role_token 
      WHERE role IN (${roleTokenParams.ids()})`,
    roleTokenParams.values()
  );

  return {
    username,
    providerUsername,
    provider,
    roles,
    ...userTokenRows
      .concat(roleTokenRows)
      .reduce((acc, i) => ((acc[i.token] = i.value), acc), {})
  };
}

export interface IGetJWTResult {
  isValidUser: boolean;
  jwt: string;
}

export async function getJWT(
  providerUsername: string,
  provider: string
): Promise<IGetJWTResult> {
  const getUsernameResult = await getUsername(providerUsername, provider);

  return getUsernameResult.isValidUser
    ? await (async () => {
        const username = getUsernameResult.username;
        const tokensForUser = await getTokensForUser(
          username,
          providerUsername,
          provider
        );
        const jwt = sign(tokensForUser);

        return {
          isValidUser: true,
          jwt
        };
      })()
    : {
        isValidUser: false,
        jwt: sign({ providerUsername, provider })
      };
}
