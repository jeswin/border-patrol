import { IRouterContext, RouterContext } from "koa-router";
import * as github from "../domain/providers/github";
import * as google from "../domain/providers/google";
import error from "../error";
import * as configModule from "../config";
import { setCookie, clearCookie } from "../utils/cookie";

export async function handleProviderCallback(
  ctx: IRouterContext,
  provider: string
) {
  const config = configModule.get();
  const successRedirectUrl = ctx.cookies.get("border-patrol-success-redirect");
  const newuserRedirectUrl = ctx.cookies.get("border-patrol-newuser-redirect");

  // Clear the cookies. We don't need them anymore.
  clearCookie(ctx, "border-patrol-success-redirect");
  clearCookie(ctx, "border-patrol-newuser-redirect");

  if (!successRedirectUrl) {
    ctx.body = 400;
    ctx.body = {
      success: false,
      error:
        "Invalid request. border-patrol-success-redirect was missing in cookie.",
    };
  } else if (!newuserRedirectUrl) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error:
        "Invalid request. border-patrol-newuser-redirect was missing in cookie.",
    };
  } else {
    const grant = (ctx as any).session.grant;

    const result =
      provider === "github"
        ? await github.getJwtAndTokensWithGrant(grant)
        : provider === "google"
        ? await google.getJwtAndTokensWithGrant(grant)
        : error("Invalid oauth service selected.");

    if (result.success) {
      setCookie(ctx, config.cookieName, result.jwt);
      ctx.redirect(
        result.isValidUser ? successRedirectUrl : newuserRedirectUrl
      );
    } else {
      ctx.body = {
        success: false,
        error: "Unimplemented.",
      };
    }
  }
}
