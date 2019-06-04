import { IRouterContext } from "koa-router";
import * as github from "../domain/oauth/github";
import error from "../error";
import * as config from "../config";

export function getJWT(provider: string) {
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
          const domain = config.get().domain;
          const tokenGrant = ctx.session.grant;
          const result =
            provider === "github"
              ? await github.getJWTWithAccessToken(
                  tokenGrant.response.access_token
                )
              : error("Invalid oauth service selected.");
          if (result.oauthSuccess) {
            if (result.isValidUser) {
              ctx.cookies.set("jwt-auth-service-token", result.jwt, {
                domain
              });
              ctx.redirect(successRedirectUrl);
            } else {
              ctx.redirect("/");
            }
          } else {
            // TODO
          }
        })();
  };
}
