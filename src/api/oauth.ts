import { IRouterContext } from "koa-router";
import * as github from "../domain/oauth/github";
import error from "../error";
import * as configModule from "../config";
import { setCookie, clearCookie } from "../utils/cookie";

export function getTokens(provider: string) {
  const config = configModule.get();

  return async (ctx: IRouterContext) => {
    const successRedirectUrl = ctx.cookies.get(
      "jwt-auth-service-success-redirect"
    );
    const newuserRedirectUrl = ctx.cookies.get(
      "jwt-auth-service-newuser-redirect"
    );

    // Clear the cookies. We don't need them anymore.
    clearCookie(ctx, "jwt-auth-service-success-redirect");
    clearCookie(ctx, "jwt-auth-service-newuser-redirect");

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
              ? await github.getTokensWithAccessToken(
                  tokenGrant.response.access_token
                )
              : error("Invalid oauth service selected.");

          if (result.oauthSuccess) {
            setCookie(ctx, "jwt-auth-service-jwt", result.jwt);
            setCookie(ctx, "jwt-auth-service-username", result.tokens.username);
            setCookie(ctx, "jwt-auth-service-domain", config.domain);
            ctx.redirect(
              result.isValidUser ? successRedirectUrl : newuserRedirectUrl
            );
          } else {
            // TODO
          }
        })();
  };
}
