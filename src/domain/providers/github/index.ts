import * as user from "../../user";
import { getUser } from "./api";
import { IGetJwtAndTokensResult } from "..";

export async function getJwtAndTokensWithGrant(
  grant: any
): Promise<IGetJwtAndTokensResult> {
  const accessToken: string = grant.response.access_token;
  const data = await getUser(accessToken);

  const username = data.login;
  return username
    ? await (async () => {
        const jwtAndTokens = await user.getJwtAndTokensByProviderIdentity(
          username,
          "github"
        );
        return {
          success: true,
          ...jwtAndTokens,
        };
      })()
    : { success: false };
}
