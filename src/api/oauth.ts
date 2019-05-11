import { IRouterContext } from "koa-router";
import * as github from "../domain/oauth/github";
import error from "../error";
import * as config from "../config";

export function getToken(service: string) {
  return async (ctx: IRouterContext) => {
    const redirectUrl = ctx.cookies.get("jwt_auth_service_redirect");
    if (!redirectUrl) {
      ctx.status = 400;
      ctx.body =
        "Invalid request. jwt_auth_service_redirect was missing in cookie.";
    } else {
      const tokenGrant = ctx.session.grant;
      const result =
        service === "github"
          ? await github.getToken(tokenGrant.response.access_token)
          : error("Invalid oauth service selected.");
      if (result.oauthSuccess) {
        if (result.isValidUser) {
          ctx.cookies.set("jwt_auth_service_token", result.token, {
            domain: config.get().domain
          });
          ctx.redirect(redirectUrl);
        } else {
          // TODO
        }
      } else {
        // TODO
      }
    }
  };
}
