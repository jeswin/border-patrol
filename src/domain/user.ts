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

export type GetPermissionsResult = {
  username: string;
  roles: string[];
  permissions: { resource: string; permission: string }[];
};

export async function getUserPermissions(
  username: string
): Promise<GetPermissionsResult> {
  const pool = getPool();

  const userPermissionParams = new pg.Params({
    username
  });

  const { rows: userPermissionRows } = await pool.query(
    `SELECT resource, permission FROM user_permission WHERE username=${userPermissionParams.id(
      "username"
    )}`,
    userPermissionParams.values()
  );

  const roles = await getRoles(username);

  const rolePermissionParams = new pg.Params({
    ...roles
  });

  const { rows: rolePermissionRows } = await pool.query(
    `SELECT resource, permission 
      FROM role_permission 
      WHERE role IN (${rolePermissionParams.ids()})`,
    rolePermissionParams.values()
  );

  return {
    username,
    roles,
    permissions: userPermissionRows.concat(rolePermissionRows)
  };
}

export interface IGetTokenResultSuccess {
  isValidUser: true;
  token: string;
}

export interface IGetTokenResultMissingUser {
  isValidUser: false;
}

export type GetTokenResult =
  | IGetTokenResultSuccess
  | IGetTokenResultMissingUser;

export async function getToken(
  providerUsername: string,
  providerName: string
): Promise<GetTokenResult> {
  const getUsernameResult = await getUsername(providerUsername, providerName);

  return getUsernameResult.isValidUser
    ? await (async () => {
        const username = getUsernameResult.username;
        const permissions = await getUserPermissions(username);
        const token = sign({ username, permissions });

        return {
          isValidUser: true,
          token
        } as IGetTokenResultSuccess;
      })()
    : ({
        isValidUser: false
      } as IGetTokenResultMissingUser);
}
