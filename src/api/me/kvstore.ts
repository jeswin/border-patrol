import { IRouterContext } from "koa-router";
import { ensureUserId } from "../authUtils";
import * as user from "../../domain/user";

export async function createKeyValuePair(ctx: IRouterContext) {
  return ensureUserId(ctx, async userId => {
    const result = await user.createKeyValuePair(
      userId,
      ctx.request.body.key,
      ctx.request.body.value,
      ctx.request.body.tag
    );
    ctx.body = {
      success: true
    };
  });
}
