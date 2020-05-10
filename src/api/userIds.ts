import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import * as configModule from "../config";

export async function getUserIdAvailability(ctx: IRouterContext) {
  const userId = ctx.params.userId;

  const result = await user.getUserIdAvailability(userId);
  ctx.body = {
    available: result.available,
  };
}
