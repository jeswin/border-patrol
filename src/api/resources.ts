import { IRouterContext } from "koa-router";
import { ensureUserId } from "./authUtils";
import * as user from "../domain/user";

export async function createResource(ctx: IRouterContext) {
  return ensureUserId(ctx, async userId => {
    const result = await user.createResource(userId);
    ctx.body = {
      success: true
    };
  });
}
