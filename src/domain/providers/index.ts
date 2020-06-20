import { IGetTokensResult } from "../user/token";

export type IGetJwtAndTokensResult =
  | { success: false, reason: string }
  | ({ success: true } & IGetTokensResult);
