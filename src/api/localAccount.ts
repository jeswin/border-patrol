import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { authenticate } from "../domain/localAccount";
import { sign } from "../utils/jwt";

export async function login(ctx: IRouterContext) {
  const config = configModule.get();

  const { username, password } = ctx.body;
  const isValidLogin = await authenticate(username, password);

  if (isValidLogin) {
    const tokenData = {
      userId: username,
      providerUserId: username,
      provider: "local",
    };
    const jwt = sign(tokenData);

    ctx.body = {
      success: true,
      userId: username,
      domain: config.domain,
      jwt,
    };
  } else {
    ctx.body = {
      success: false,
    };
  }
}
