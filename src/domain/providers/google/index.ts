import * as user from "../../user";
import { decode, IJwt } from "../../../utils/jwt";

export async function getJwtAndTokensWithGrant(grant: any) {
  const idToken = grant.response.id_token;

  // We don't verify the token because we trust the secure link to Google
  // But revisit this later.
  const decodedToken = decode(idToken) as IJwt;

  const userId = decodedToken.email;

  return userId
    ? await (async () => {
        const result = await user.getJwtAndTokensByProviderIdentity(
          userId,
          "google"
        );
        return {
          fetchedProviderUser: true as true,
          ...result,
        };
      })()
    : {
        fetchedProviderUser: false as false,
        error: "Did not get email address from Google.",
      };
}
