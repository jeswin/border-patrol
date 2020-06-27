import * as pg from "psychopiggy";
import { getPool } from "../../db";
import { getRoles } from "./role";
import { getUserId } from ".";
import { sign } from "../../utils/jwt";

export type GetTokensForUserResult = { [key: string]: string };

export async function getTokensForUser(
  userId: string
): Promise<GetTokensForUserResult> {
  const pool = getPool();

  const userTokenParams = new pg.Params({
    user_id: userId,
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
          ...roles,
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
        ...tokens,
      }
    : {
        userId,
        ...tokens,
      };

  return result;
}

export interface IGetTokensResult {
  foundUser: boolean;
  jwt: string;
  tokens: { [key: string]: string };
}

export async function getJwtAndTokensByProviderIdentity(
  providerUserId: string,
  provider: string
): Promise<IGetTokensResult> {
  const getUserIdResult = await getUserId(providerUserId, provider);

  return getUserIdResult.foundUser
    ? await (async () => {
        const userId = getUserIdResult.userId;
        const tokensForUser = await getTokensForUser(userId);
        return {
          foundUser: true as true,
          jwt: sign({ ...tokensForUser, providerUserId, provider }),
          tokens: { ...tokensForUser, providerUserId, provider },
        };
      })()
    : {
        foundUser: false as false,
        jwt: sign({ providerUserId, provider }),
        tokens: { providerUserId, provider },
      };
}
