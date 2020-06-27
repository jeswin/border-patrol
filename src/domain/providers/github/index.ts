import * as user from "../../user";
import { getUser } from "./api";

export async function getJwtAndTokensWithGrant(grant: any) {
  const accessToken: string = grant.response.access_token;
  const data = await getUser(accessToken);

  const providerUserId = data.login;
  return providerUserId
    ? await (async () => {
        const result = await user.getJwtAndTokensByProviderIdentity(
          providerUserId,
          "github"
        );
        return {
          fetchedProviderUser: true as true,
          ...result,
        };
      })()
    : {
        fetchedProviderUser: false as false,
        error: "Did not get user id from github.",
      };
}
