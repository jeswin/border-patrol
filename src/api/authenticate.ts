import { IRouterContext } from "koa-router";
import * as config from "../config";
import error from "../error";

export async function authenticate(ctx: IRouterContext) {
  const { service } = ctx.params;
  const redirect = ctx.query.redirect;
  ctx.cookies.set("oauth_jwt_service_redirect", redirect, { domain: config.get().domain });
  ctx.redirect(`/connect/${service}`);
}
