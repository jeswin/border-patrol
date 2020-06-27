import * as user from "../domain/user";
import { IRouterContext } from "koa-router";
import * as configModule from "../config";
import { setCookie } from "../utils/cookie";
import { ensureJwt } from "./authUtils";

export async function createUser(ctx: IRouterContext) {
  const config = configModule.get();
  function onSuccess(jwt: string, userId: string) {
    setCookie(ctx, config.cookieName, jwt);
    ctx.body = {
      success: true,
      result: {
        [config.cookieName]: jwt,
      },
    };
  }

  return ensureJwt(ctx, async (result) => {
    const createUserResult = await user.createUser(
      ctx.request.body.userId,
      result.value.providerUserId,
      result.value.provider
    );

    if (createUserResult.created) {
      onSuccess(createUserResult.jwt, createUserResult.tokens.userId);
    } else {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: createUserResult.reason,
      };
    }
  });
}

export async function adminDeleteUser(ctx: IRouterContext) {
  const config = configModule.get();

  const userId = ctx.params.userId;
  const adminKey = ctx.get("border-patrol-admin-key");

  if (config.adminKey && adminKey === config.adminKey) {
    await user.deleteUser(userId);

    ctx.body = {
      success: true,
    };
  } else {
    ctx.status = 401;
    ctx.body = {
      success: false,
      error: "Unauthorized.",
    };
  }
}
