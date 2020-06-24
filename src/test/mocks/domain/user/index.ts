import * as userModule from "../../../../domain/user";

export async function createUser(
  userId: string,
  providerUserId: string,
  provider: string
) {
  return {
    created: true,
    jwt: "some_other_jwt",
    tokens: { userId: "jeswin" },
  } as userModule.CreateUserResult;
}
