import request = require("request");
import { promisify } from "util";
import * as user from "../user";

const httpGet = promisify(request.get);

export interface IGetTokenResultGitHubError {
  oauthSuccess: false;
}

export interface IGetTokenResultMissingUser {
  oauthSuccess: true;
  isValidUser: false;
}

export interface IGetTokenResultSuccess {
  oauthSuccess: true;
  isValidUser: true;
  token: string;
}

export type GetTokenResult =
  | IGetTokenResultGitHubError
  | IGetTokenResultMissingUser
  | IGetTokenResultSuccess;

export async function getToken(
  accessToken: string
): Promise<GetTokenResult> {
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
        const token = await user.getToken(data.login, "github");
        const result: IGetTokenResultSuccess | IGetTokenResultMissingUser = {
          oauthSuccess: true,
          ...token
        };
        return result;
      })()
    : { oauthSuccess: false };
}
