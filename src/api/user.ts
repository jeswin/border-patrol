import * as user from "../domain/user";
import { IRouterContext } from "koa-router";

export async function getUsernameAvailability(ctx: IRouterContext) {
  const result = await user.getUsernameAvailability(ctx.params.username);
  ctx.body = {
    exists: result.exists
  };
}
