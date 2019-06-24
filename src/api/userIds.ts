import * as user from "../domain/user";
import { IRouterContext } from "koa-router";

export async function getUserIdAvailability(ctx: IRouterContext) {
  const result = await user.getUserIdAvailability(ctx.params.userId);
  ctx.body = {
    exists: result.exists
  };
}
