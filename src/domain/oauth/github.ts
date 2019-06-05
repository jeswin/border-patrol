import request = require("request");
import { promisify } from "util";
import * as user from "../user";

const httpGet = promisify(request.get);

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

export async function getTokensWithAccessToken(
  accessToken: string
): Promise<GetTokensResult> {
  const response = (await httpGet(
    {
      url: `https://api.github.com/user?access_token=${accessToken}`,
      headers: { "user-agent": "node.js" }
    },
    undefined
  )) as { body: string };

  const data = JSON.parse(response.body);

  return data.login
    ? await (async () => {
        const tokensResult = await user.getTokens(data.login, "github");
        const result: IGetTokensResult = {
          oauthSuccess: true,
          ...tokensResult
        };
        return result;
      })()
    : { oauthSuccess: false };
}
