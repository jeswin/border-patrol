import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { setCookie } from "../utils/cookie";
import { ensureJwt } from "./authUtils";

export async function createUser(ctx: IRouterContext) {
  const config = configModule.get();

  function onSuccess(jwt: string, userId: string, useCookie: boolean) {
    if (useCookie) {
      setCookie(ctx, "border-patrol-jwt", jwt);
      setCookie(ctx, "border-patrol-user-id", userId);
      setCookie(ctx, "border-patrol-domain", config.domain);
    }
    ctx.body = {
      "border-patrol-jwt": jwt,
      "border-patrol-user-id": userId,
      "border-patrol-domain": config.domain
    };
  }

  return ensureJwt(ctx, async (result, { isJwtInCookie }) => {
    const createUserResult = await user.createUser(
      ctx.request.body.userId,
      result.value.providerUserId,
      result.value.provider
    );
    return createUserResult.created
      ? onSuccess(
          createUserResult.jwt,
          createUserResult.tokens.userId,
          isJwtInCookie
        )
      : ((ctx.status = 400), (ctx.body = createUserResult.reason));
  });
}