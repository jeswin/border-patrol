import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import { verify, IVerifiedJWT, IVerifiedValidJWT } from "../utils/jwt";
import * as configModule from "../config";
import { setCookie } from "../utils/cookie";

export async function getUserIdAvailability(ctx: IRouterContext) {
  const result = await user.getUserIdAvailability(ctx.params.userId);
  ctx.body = {
    exists: result.exists
  };
}

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

  return ensureJWT(ctx, async (result, { isJwtInCookie }) => {
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

export async function createKeyValuePair(ctx: IRouterContext) {
  return ensureJWT(ctx, async (verfiedJWT, { isJwtInCookie }) => {
    const userId = verfiedJWT.value.userId;
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await (async () => {
          const result = await user.createKeyValuePair(
            userId,
            ctx.request.body.key,
            ctx.request.body.value,
            ctx.request.body.tag
          );
          ctx.body = {
            success: true
          };
        })();
  });
}

export async function createResource(ctx: IRouterContext) {
  return ensureJWT(ctx, async (verfiedJWT, { isJwtInCookie }) => {
    const userId = verfiedJWT.value.userId;
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await (async () => {
          const result = await user.createResource(
            userId,
            ctx.request.body.name
          );
          ctx.body = {
            success: true
          };
        })();
  });
}
