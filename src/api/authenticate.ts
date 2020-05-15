import urlModule = require("url");
import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { setTempCookie } from "../utils/cookie";

function isInDomain(url: string) {
  const config = configModule.get();

  const hostname = urlModule.parse(url).host;
  return (
    hostname &&
    (hostname === config.domain || hostname.endsWith(`.${config.domain}`))
  );
}

export function authenticate(service: string) {
  const config = configModule.get();
  
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
      : (setTempCookie(ctx, "border-patrol-success-redirect", successRedirect),
        setTempCookie(ctx, "border-patrol-newuser-redirect", newuserRedirect),
        ctx.redirect(`/connect/${service}`));
  };
}
