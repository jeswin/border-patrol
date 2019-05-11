import { IRouterContext } from "koa-router";
import * as config from "../config";

const oauthServices = ["github"];

export function authenticate(service: string) {
  return async (ctx: IRouterContext) => {
    const redirect = ctx.query.redirect;
    ctx.cookies.set("jwt_auth_service_redirect", redirect, {
      domain: config.get().domain
    });

    if (service === "login") {
      ctx.status = 406;
      ctx.body = "Password based authentication is not supported yet.";
    } else if (oauthServices.includes(service)) {
      ctx.redirect(`/connect/${service}`);
    }
  };
}
