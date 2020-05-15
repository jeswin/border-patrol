import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { setCookie } from "../utils/cookie";
import { ensureJwt } from "./authUtils";


export async function createUser(ctx: IRouterContext) {
  const config = configModule.get();
  function onSuccess(jwt: string, userId: string) {
    setCookie(ctx, config.cookieName, jwt);
    ctx.body = {
      [config.cookieName]: jwt,
    };
  }

  return ensureJwt(ctx, async (result) => {
    const createUserResult = await user.createUser(
      ctx.request.body.userId,
      result.value.providerUserId,
      result.value.provider
    );
    return createUserResult.created
      ? onSuccess(createUserResult.jwt, createUserResult.tokens.userId)
      : ((ctx.status = 400), (ctx.body = createUserResult.reason));
  });
}
