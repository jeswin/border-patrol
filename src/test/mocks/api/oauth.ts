import * as oauthAPIModule from "../../../api/oauth";
import { RouterContext } from "koa-router";

const originalHandleProviderCallback = oauthAPIModule.handleProviderCallback;

export async function handleProviderCallback(
  ctx: RouterContext,
  provider: string
) {
  (ctx as any).session = {
    grant: { response: { access_token: "some_token" } },
  };
  return await originalHandleProviderCallback(ctx, provider);
}
