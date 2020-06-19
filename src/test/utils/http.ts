import { CancelableRequest } from "got/dist/source";
import { Response } from "got/dist/source/core";

export async function getResponse(
  promisedResponse: CancelableRequest<Response<string>>
): Promise<Response<string>> {
  try {
    return await promisedResponse;
  } catch (ex) {
    return ex.response;
  }
}
