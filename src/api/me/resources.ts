import { IRouterContext } from "koa-router";
import { ensureJWT } from "../authUtils";
import * as user from "../../domain/user";

export async function createResource(ctx: IRouterContext) {
  return ensureJWT(ctx, async verfiedJWT => {
    const userId = verfiedJWT.value.userId;
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await (async () => {
          const result = await user.createResource(
            userId,
            ctx.request.body.name
          );
          ctx.body = {
            success: true
          };
        })();
  });
}
