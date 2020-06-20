export async function getJwtAndTokensWithGrant() {
  return {
    isValidUser: false,
    success: true as true,
    jwt: "some_jwt",
    tokens: { userId: "some_userid" },
  };
}