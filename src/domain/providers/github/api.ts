import { promisify } from "util";
import got from "got";

export async function getUser(accessToken: string) {
  const response = await got(
    `https://api.github.com/user?access_token=${accessToken}`,
    {
      headers: { "user-agent": "node.js" },
    }
  );

  return JSON.parse(response.body);
}
