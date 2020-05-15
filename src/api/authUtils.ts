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
  const jwt: string = ctx.headers[config.cookieName];

  return !jwt
    ? /* JWT was missing */
      ((ctx.status = 400),
      (ctx.body =
        "Missing JWT token in request. Pass via cookies or in the header."))
    : await (async () => {
        const result = jwtModule.verify(jwt);
        return !result.valid
          ? /* Invalid JWT */
            ((ctx.status = 400), (ctx.body = "Invalid JWT token."))
          : await then(result, {
              jwt,
            });
      })();
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
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await then(userId, verifiedJwt, args);
  });
}
