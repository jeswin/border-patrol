import * as kvstoreModule from "../../../../domain/user/kvstore";

export async function createKeyValuePair() {
  return {
    created: true,
    edit: "insert",
  } as kvstoreModule.CreateKeyValuePairResult;
}
