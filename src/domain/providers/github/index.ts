import * as user from "../../user";
import { getUser } from "./api";
import { IGetJwtAndTokensResult } from "..";

export async function getJwtAndTokensWithGrant(
  grant: any
): Promise<IGetJwtAndTokensResult> {
  const accessToken: string = grant.response.access_token;
  const data = await getUser(accessToken);

  const providerUserId = data.login;
  return providerUserId
    ? await (async () => {
        const jwtAndTokens = await user.getJwtAndTokensByProviderIdentity(
          providerUserId,
          "github"
        );
        return {
          success: true as true,
          ...jwtAndTokens,
        };
      })()
    : { success: false, reason: "Did not get user id from github." };
}
