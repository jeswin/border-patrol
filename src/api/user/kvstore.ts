import { IRouterContext } from "koa-router";
import { ensureJWT } from "../authUtils";
import * as user from "../../domain/user";

export async function createKeyValuePair(ctx: IRouterContext) {
  return ensureJWT(ctx, async (verfiedJWT, { isJwtInCookie }) => {
    const userId = verfiedJWT.value.userId;
    return !userId
      ? ((ctx.status = 400),
        (ctx.body = "User id was not found in the JWT token."))
      : await (async () => {
          const result = await user.createKeyValuePair(
            userId,
            ctx.request.body.key,
            ctx.request.body.value,
            ctx.request.body.tag
          );
          ctx.body = {
            success: true
          };
        })();
  });
}
