export async function getJwtAndTokensWithGrant() {
  return {
    fetchedProviderUser: true as true,
    foundUser: true as true,
    jwt: "some_jwt",
    tokens: { userId: "some_userid" },
  };
}
