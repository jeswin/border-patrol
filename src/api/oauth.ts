import { IRouterContext } from "koa-router";
import * as github from "../domain/oauth/github";
import error from "../error";
import * as configModule from "../config";

export function getJWT(provider: string) {
  const config = configModule.get();
  return async (ctx: IRouterContext) => {
    const successRedirectUrl = ctx.cookies.get(
      "jwt-auth-service-success-redirect"
    );
    const newuserRedirectUrl = ctx.cookies.get(
      "jwt-auth-service-newuser-redirect"
    );

    return !successRedirectUrl
      ? ((ctx.status = 400),
        (ctx.body =
          "Invalid request. jwt-auth-service-success-redirect was missing in cookie."))
      : !newuserRedirectUrl
      ? ((ctx.status = 400),
        (ctx.body =
          "Invalid request. jwt-auth-service-newuser-redirect was missing in cookie."))
      : await (async () => {
          const domain = configModule.get().domain;
          const tokenGrant = ctx.session.grant;
          const result =
            provider === "github"
              ? await github.getJWTWithAccessToken(
                  tokenGrant.response.access_token
                )
              : error("Invalid oauth service selected.");

          if (result.oauthSuccess) {
            ctx.cookies.set("jwt-auth-service-token", result.jwt, {
              domain,
              httpOnly: config.cookies.httpOnly,
              maxAge: config.cookies.maxAge,
              overwrite: true
            });
            ctx.redirect(
              result.isValidUser ? successRedirectUrl : newuserRedirectUrl
            );
          } else {
            // TODO
          }
        })();
  };
}
