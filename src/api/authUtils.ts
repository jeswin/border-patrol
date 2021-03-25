import { IRouterContext } from "koa-router";
import * as jwtModule from "../utils/jwt";
import * as configModule from "../config";

export async function ensureJwt(
  ctx: IRouterContext,
  then: (
    verifiedJwt: jwtModule.IVerifiedValidJwt,
    args: { jwt: string }
  ) => Promise<any>
) {
  const config = configModule.get();
  const cookie = ctx.headers[config.cookieName];
  const jwt = cookie ? (Array.isArray(cookie) ? cookie[0] : cookie) : undefined;

  if (!jwt) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error: "Missing JWT in request. Pass JWT in the header.",
    };
  } else {
    const result = jwtModule.verify(jwt);
    if (!result.valid) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "Invalid JWT.",
      };
    } else {
      return await then(result, {
        jwt,
      });
    }
  }
}

export async function ensureUserId(
  ctx: IRouterContext,
  then: (
    userId: string,
    verifiedJwt: jwtModule.IVerifiedValidJwt,
    args: { jwt: string }
  ) => Promise<any>
) {
  return ensureJwt(ctx, async (verifiedJwt, args) => {
    const userId = verifiedJwt.value.userId;

    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "User id was not found in the JWT.",
      };
    } else {
      return await then(userId, verifiedJwt, args);
    }
  });
}
