import { IRouterContext } from "koa-router";
import * as config from "../config";

const oauthServices = ["github"];

function isInDomain(url: string) {
  const domain = config.get().domain;
  return url.endsWith(`/${domain}`) || url.endsWith(`.${domain}`);
}

export function authenticate(service: string) {
  const domain = config.get().domain;
  return async (ctx: IRouterContext) => {
    const successRedirect = ctx.query.success;
    const newuserRedirect = ctx.query.newuser;

    const [status, body]: [400 | 406, string] | [200] =
      service === "login"
        ? [406, "Password based authentication is not supported yet."]
        : !successRedirect
        ? [
            400,
            "Success redirect was not specified. Pass it as a query string parameter."
          ]
        : !isInDomain(successRedirect)
        ? [
            400,
            "Success redirect must be a url within the application's domain."
          ]
        : !newuserRedirect
        ? [
            400,
            "New user redirect was not specified. Pass it as a query string parameter."
          ]
        : !isInDomain(newuserRedirect)
        ? [
            400,
            "New user redirect must be a url within the application's domain."
          ]
        : [200];

    return status !== 200
      ? (() => {
          ctx.status = status;
          ctx.body = body;
        })()
      : (() => {
          ctx.cookies.set(
            "jwt-auth-service-success-redirect",
            successRedirect,
            {
              domain
            }
          );
          ctx.cookies.set(
            "jwt-auth-service-newuser-redirect",
            newuserRedirect,
            {
              domain
            }
          );

          ctx.redirect(`/connect/${service}`);
        })();
  };
}
