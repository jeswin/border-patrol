import { IRouterContext } from "koa-router";
import * as github from "../domain/oauth/github";
import error from "../error";
import * as config from "../config";

export async function getToken(ctx: IRouterContext) {
  const redirectUrl = ctx.cookies.get("redirect_url");
  if (!redirectUrl) {
    ctx.status = 400;
    ctx.body = "Invalid request. redirect_url was missing in cookie.";
  } else {
    const oauthService = ctx.params.service;
    const tokenGrant = ctx.session.grant;
    const result =
      oauthService === "github"
        ? await github.getToken(tokenGrant.response.access_token)
        : error("Invalid oauth service selected.");
    if (result.oauthSuccess) {
      if (result.isValidUser) {
        ctx.cookies.set("jwt_token", result.token, {
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
}
