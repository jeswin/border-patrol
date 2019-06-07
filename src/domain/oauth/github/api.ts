import request = require("request");
import { promisify } from "util";

const httpGet = promisify(request.get);

export async function getUser(accessToken: string) {
  const response = (await httpGet(
    {
      url: `https://api.github.com/user?access_token=${accessToken}`,
      headers: { "user-agent": "node.js" }
    },
    undefined
  )) as { body: string };

  const data = JSON.parse(response.body);

  return data;
}
