import * as user from "../../user";
import { getUser } from "./api";

export interface IGetJWTResultGitHubError {
  oauthSuccess: false;
}

export interface IGetTokensResult {
  oauthSuccess: true;
  isValidUser: boolean;
  jwt: string;
  tokens: { [key: string]: string };
}

export type GetTokensResult = IGetJWTResultGitHubError | IGetTokensResult;

export async function getTokensByAccessToken(
  accessToken: string
): Promise<GetTokensResult> {
  const data = await getUser(accessToken);

  return data.login
    ? await (async () => {
        const tokensResult = await user.getTokensByProviderCredentials(
          data.login,
          "github"
        );
        const result: IGetTokensResult = {
          oauthSuccess: true,
          ...tokensResult
        };
        return result;
      })()
    : { oauthSuccess: false };
}
