import request = require("request");
import { promisify } from "util";
import * as user from "../user";

const httpGet = promisify(request.get);

export interface IGetJWTResultGitHubError {
  oauthSuccess: false;
}

export interface IGetJWTResult {
  oauthSuccess: true;
  isValidUser: boolean;
  jwt: string;
}

export type GetJWTResult = IGetJWTResultGitHubError | IGetJWTResult;

export async function getJWTWithAccessToken(
  accessToken: string
): Promise<GetJWTResult> {
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
        const result: IGetJWTResult = {
          oauthSuccess: true,
          ...token
        };
        return result;
      })()
    : { oauthSuccess: false };
}
