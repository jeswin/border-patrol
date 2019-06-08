import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import { verify } from "../utils/jwt";
import * as configModule from "../config";
import { setCookie } from "../utils/cookie";

export async function getUserIdAvailability(ctx: IRouterContext) {
  const result = await user.getUserIdAvailability(ctx.params.userId);
  ctx.body = {
    exists: result.exists
  };
}

export async function createUser(ctx: IRouterContext) {
  const config = configModule.get();
  const jwtInCookie = ctx.cookies.get("jwt-auth-service-jwt");
  const jwtInHeader = ctx.headers["jwt-auth-service-jwt"];

  return jwtInCookie && jwtInHeader && jwtInCookie !== jwtInHeader
    ? /* JWT values in the cookie and the header are mismatched */
      ((ctx.status = 400),
      (ctx.body =
        "When JWT is provided in both the cookie and in the header, they should have the same values."))
    : await (async () => {
        const jwt = jwtInCookie || jwtInHeader;
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
                : await (async () => {
                    const createUserResult = await user.createUser(
                      ctx.request.body.userId,
                      result.value.providerUserId,
                      result.value.provider
                    );
                    return createUserResult.created
                      ? (() => {
                          if (jwtInCookie) {
                            setCookie(
                              ctx,
                              "jwt-auth-service-jwt",
                              createUserResult.jwt
                            );
                            setCookie(
                              ctx,
                              "jwt-auth-service-user-id",
                              createUserResult.tokens.userId
                            );
                            setCookie(
                              ctx,
                              "jwt-auth-service-domain",
                              config.domain
                            );
                          }
                          ctx.body = {
                            "jwt-auth-service-jwt": createUserResult.jwt,
                            "jwt-auth-service-user-id":
                              createUserResult.tokens.userId,
                            "jwt-auth-service-domain": config.domain
                          };
                        })()
                      : ((ctx.status = 400),
                        (ctx.body = createUserResult.reason));
                  })();
            })();
      })();
}
