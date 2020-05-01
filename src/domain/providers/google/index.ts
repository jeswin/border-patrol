import * as user from "../../user";
import { IGetJwtAndTokensResult } from "..";
import { decode, IJwt } from "../../../utils/jwt";

export async function getJwtAndTokensWithGrant(
  grant: any
): Promise<IGetJwtAndTokensResult> {
  const idToken = grant.response.id_token;

  // We don't verify the token because we trust the secure link to Google
  // But revisit this later.
  const decodedToken = decode(idToken) as IJwt;  
  
  const username = decodedToken.email;

  return username
    ? await (async () => {
        const jwtAndTokens = await user.getJwtAndTokensByProviderIdentity(
          username,
          "google"
        );
        const result = {
          success: true,
          ...jwtAndTokens,
        };
        return result;
      })()
    : { success: false };
}
