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
  serviceUsername: string,
  serviceType: string
): Promise<GetUsernameResult> {
  const pool = getPool();

  const params = new pg.Params({
    serviceUsername,
    serviceType
  });

  const { rows } = await pool.query(
    `SELECT username FROM "user" WHERE service_username=${params.id(
      "serviceUsername"
    )} AND service_type=${params.id("serviceType")}`,
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

export type GetPermissionsResult = {
  username: string;
  permissions: { resource: string, permission: string }[]
}

export async function getPermissions(username: string): Promise<GetPermissionsResult> {
  const pool = getPool();

  const params = new pg.Params({
    username
  });

  const { rows } = await pool.query(
    `SELECT resource, permission FROM permission WHERE username=${params.id(
      "username"
    )}`,
    params.values()
  );

  return {
    username,
    permissions: rows
  };
}

export interface IGetTokenResultSuccess {
  isValidUser: true;
  token: string;
}

export interface IGetTokenResultMissingUser {
  isValidUser: false;
}

export type GetTokenResult = IGetTokenResultSuccess | IGetTokenResultMissingUser;

export async function getToken(serviceUsername: string, serviceType: string): Promise<GetTokenResult> {
  const getUsernameResult = await getUsername(serviceUsername, serviceType);

  return getUsernameResult.isValidUser
    ? await (async () => {
      const username = getUsernameResult.username;
      const permissions = await getPermissions(
        username
      );
      const token = sign({ username, permissions });

      return {
        isValidUser: true,
        token
      } as IGetTokenResultSuccess;
    })()
    : ({
      isValidUser: false,
    } as IGetTokenResultMissingUser);
}
