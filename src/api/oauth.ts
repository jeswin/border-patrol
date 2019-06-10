import { IRouterContext, RouterContext } from "koa-router";
import * as github from "../domain/oauth/github";
import error from "../error";
import * as configModule from "../config";
import { setCookie, clearCookie } from "../utils/cookie";

export async function getTokens(ctx: IRouterContext, provider: string) {
  const config = configModule.get();

  const successRedirectUrl = ctx.cookies.get(
    "border-patrol-success-redirect"
  );
  const newuserRedirectUrl = ctx.cookies.get(
    "border-patrol-newuser-redirect"
  );

  // Clear the cookies. We don't need them anymore.
  clearCookie(ctx, "border-patrol-success-redirect");
  clearCookie(ctx, "border-patrol-newuser-redirect");

  return !successRedirectUrl
    ? ((ctx.status = 400),
      (ctx.body =
        "Invalid request. border-patrol-success-redirect was missing in cookie."))
    : !newuserRedirectUrl
    ? ((ctx.status = 400),
      (ctx.body =
        "Invalid request. border-patrol-newuser-redirect was missing in cookie."))
    : await (async () => {
        const domain = configModule.get().domain;
        const tokenGrant = ctx.session.grant;
        const result =
          provider === "github"
            ? await github.getTokensByAccessToken(
                tokenGrant.response.access_token
              )
            : error("Invalid oauth service selected.");

        if (result.oauthSuccess) {
          setCookie(ctx, "border-patrol-jwt", result.jwt);
          setCookie(ctx, "border-patrol-user-id", result.tokens.userId);
          setCookie(ctx, "border-patrol-domain", config.domain);
          ctx.redirect(
            result.isValidUser ? successRedirectUrl : newuserRedirectUrl
          );
        } else {
          // TODO
        }
      })();
}
