import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import { verify } from "../domain/jwt";
import * as config from "../config";

export async function getUsernameAvailability(ctx: IRouterContext) {
  const result = await user.getUsernameAvailability(ctx.params.username);
  ctx.body = {
    exists: result.exists
  };
}

export async function createUser(ctx: IRouterContext) {
  const jwtInCookie = ctx.cookies.get("jwt-auth-service-token");
  const jwtInHeader = ctx.headers["jwt-auth-service-token"];

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
                      ctx.body.username,
                      result.value.providerUsername,
                      result.value.provider
                    );
                    return createUserResult.created
                      ? (() => {
                          const domain = config.get().domain;
                          if (jwtInCookie) {
                            ctx.cookies.set(
                              "jwt-auth-service-token",
                              createUserResult.jwt,
                              {
                                domain
                              }
                            );
                          }
                          if (jwtInHeader) {
                            ctx.body = {
                              "jwt-auth-service-token": createUserResult.jwt
                            };
                          }
                        })()
                      : ((ctx.status = 400),
                        (ctx.body = createUserResult.reason));
                  })();
            })();
      })();
}
