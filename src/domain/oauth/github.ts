import request = require("request");
import { promisify } from "util";
import * as user from "../user";

const httpGet = promisify(request.get);

export interface IGetJWTResultGitHubError {
  oauthSuccess: false;
}

export interface IGetJWTResultMissingUser {
  oauthSuccess: true;
  isValidUser: false;
}

export interface IGetJWTResultSuccess {
  oauthSuccess: true;
  isValidUser: true;
  jwt: string;
}

export type GetJWTResult =
  | IGetJWTResultGitHubError
  | IGetJWTResultMissingUser
  | IGetJWTResultSuccess;

export async function getJWT(accessToken: string): Promise<GetJWTResult> {
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
        const token = await user.getJWT(data.login, "github");
        const result: IGetJWTResultSuccess | IGetJWTResultMissingUser = {
          oauthSuccess: true,
          ...token
        };
        return result;
      })()
    : { oauthSuccess: false };
}
