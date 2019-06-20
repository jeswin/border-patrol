import urlModule = require("url");
import { IRouterContext } from "koa-router";
import * as config from "../config";
import { setTempCookie } from "../utils/cookie";

const oauthServices = ["github"];

function isInDomain(url: string) {
  const hostname = urlModule.parse(url).host;
  const domain = config.get().domain;
  return hostname && (hostname === domain || hostname.endsWith(`.${domain}`));
}

export function authenticate(service: string) {
  const domain = config.get().domain;
  return async (ctx: IRouterContext) => {
    const successRedirect = ctx.query.success;
    const newuserRedirect = ctx.query.newuser;

    return service === "login"
      ? ((ctx.status = 406),
        "Password based authentication is not supported yet.")
      : !successRedirect
      ? ((ctx.status = 400),
        (ctx.body =
          "Success redirect was not specified. Pass it as a query string parameter."))
      : !isInDomain(successRedirect)
      ? ((ctx.status = 400),
        (ctx.body =
          "Success redirect must be a url within the application's domain."))
      : !newuserRedirect
      ? ((ctx.status = 400),
        (ctx.body =
          "New user redirect was not specified. Pass it as a query string parameter."))
      : !isInDomain(newuserRedirect)
      ? ((ctx.status = 400),
        (ctx.body =
          "New user redirect must be a url within the application's domain."))
      : (setTempCookie(
          ctx,
          "border-patrol-success-redirect",
          successRedirect
        ),
        setTempCookie(
          ctx,
          "border-patrol-newuser-redirect",
          newuserRedirect
        ),
        ctx.redirect(`/connect/${service}`));
  };
}