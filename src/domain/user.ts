import { sign } from "./jwt";
import * as pg from "psychopiggy";
import { getPool } from "../db";

export type GetUsernameResult =
  | {
      isValidUser: true;
      username: string;
    }
  | { isValidUser: false };

export async function getUsername(
  providerUsername: string,
  providerName: string
): Promise<GetUsernameResult> {
  const pool = getPool();

  const params = new pg.Params({
    providerUsername,
    providerName
  });

  const { rows } = await pool.query(
    `SELECT username FROM "user" WHERE provider_username=${params.id(
      "providerUsername"
    )} AND provider_name=${params.id("providerName")}`,
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

export type getTokensForUserResult = {
  username: string;
  roles: string[];
  tokens: { token: string; value: string }[];
};

export async function getTokensForUser(
  username: string
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
    roles,
    tokens: userTokenRows.concat(roleTokenRows)
  };
}

export interface IGetJWTResultSuccess {
  isValidUser: true;
  jwt: string;
}

export interface IGetJWTResultMissingUser {
  isValidUser: false;
}

export type GetJWTResult =
  | IGetJWTResultSuccess
  | IGetJWTResultMissingUser;

export async function getJWT(
  providerUsername: string,
  providerName: string
): Promise<GetJWTResult> {
  const getUsernameResult = await getUsername(providerUsername, providerName);

  return getUsernameResult.isValidUser
    ? await (async () => {
        const username = getUsernameResult.username;
        const tokensForUser = await getTokensForUser(username);
        const jwt = sign(tokensForUser);

        return {
          isValidUser: true,
          jwt
        } as IGetJWTResultSuccess;
      })()
    : ({
        isValidUser: false
      } as IGetJWTResultMissingUser);
}
