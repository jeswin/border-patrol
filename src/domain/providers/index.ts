import { IGetTokensResult } from "../user/token";

export type IGetJwtAndTokensResult =
  | { success: false }
  | ({ success: true } & IGetTokensResult);
1