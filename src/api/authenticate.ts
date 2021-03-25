import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { setTempCookie } from "../utils/cookie";

function isInDomain(url: string) {
  const config = configModule.get();
  const hostname = new URL(url).hostname;

  return (
    hostname &&
    (hostname === config.domain || hostname.endsWith(`.${config.domain}`))
  );
}

export function authenticate(service: string) {
  const config = configModule.get();

  return async (ctx: IRouterContext) => {
    const successRedirect = ctx.query.success
      ? Array.isArray(ctx.query.success)
        ? ctx.query.success[0]
        : ctx.query.success
      : undefined;
    const newuserRedirect = ctx.query.newuser
      ? Array.isArray(ctx.query.newuser)
        ? ctx.query.newuser[0]
        : ctx.query.newuser
      : undefined;

    if (service === "login") {
      ctx.status = 406;
      ctx.body = {
        success: false,
        error: "Password based authentication is not supported yet.",
      };
    } else if (!successRedirect) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error:
          "Success redirect was not specified. Pass it as a query string parameter.",
      };
    } else if (!isInDomain(successRedirect)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error:
          "Success redirect must be a url within the application's domain.",
      };
    } else if (!newuserRedirect) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error:
          "New user redirect was not specified. Pass it as a query string parameter.",
      };
    } else if (!isInDomain(newuserRedirect)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error:
          "New user redirect must be a url within the application's domain.",
      };
    } else {
      setTempCookie(ctx, "border-patrol-success-redirect", successRedirect);
      setTempCookie(ctx, "border-patrol-newuser-redirect", newuserRedirect);
      ctx.redirect(`/connect/${service}`);
    }
  };
}
