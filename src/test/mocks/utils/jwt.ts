import * as jwtModule from "../../../utils/jwt";

export function verify() {
  return {
    valid: true,
    value: {
      userId: "jeswin",
      providerUserId: "jeswin",
      provider: "github",
    },
  };
}
