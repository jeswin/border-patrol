import { IRouterContext } from "koa-router";
import { IVerifiedValidJWT, verify } from "../utils/jwt";
import { IRouter } from "express";

export async function ensureJWT(
  ctx: IRouterContext,
  then: (
    verifiedJWT: IVerifiedValidJWT,
    args: { jwt: string; isJwtInCookie: boolean }
  ) => Promise<any>
) {
  const jwtInCookie: string | undefined = ctx.cookies.get("border-patrol-jwt");
  const jwtInHeader: string = ctx.headers["border-patrol-jwt"];

  return jwtInCookie && jwtInHeader && jwtInCookie !== jwtInHeader
    ? /* JWT values in the cookie and the header are mismatched */
      ((ctx.status = 400),
      (ctx.body =
        "When JWT is provided in both the cookie and in the header, they should have the same values."))
    : await (async () => {
        const jwt: string = jwtInCookie || jwtInHeader;
        return !jwt
          ? /* JWT was missing */
            ((ctx.status = 400),
            (ctx.body =
              "Missing JWT token in request. Pass via cookies or in the header."))
          : await (async () => {
              const result = verify(jwt);
              return !result.valid
                ? /* Invalid JWT */
                  ((ctx.status = 400), (ctx.body = "Invalid JWT token."))
                : await then(result, {
                    jwt,
                    isJwtInCookie: typeof jwtInCookie !== "undefined"
                  });
            })();
      })();
}

export async function ensureUserId(
  ctx: IRouterContext,
  then: (
    userId: string,
    verifiedJWT: IVerifiedValidJWT,
    args: { jwt: string; isJwtInCookie: boolean }
  ) => Promise<any>
) {
  return ensureJWT(ctx, async (verfiedJWT, args) => {
    const userId = verfiedJWT.value.userId;
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await then(userId, verfiedJWT, args);
  });
}
