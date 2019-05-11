import jwt = require("jsonwebtoken");

export interface IJWTConfig {
  JWT_PUBLIC_KEY: string;
  JWT_PRIVATE_KEY: string;
  signOptions: object;
}

let config: IJWTConfig;

export function init(c: IJWTConfig) {
  if (!config) {
    config = c;
  } else {
    throw("JWT config has already been initialized.");
  }
}

export function sign(payload: any) {
  return jwt.sign(payload, config.JWT_PRIVATE_KEY, config.signOptions);
}

/*
  verify: (token, $Option) => {
    vOption = {
      issuer: "Authorization/Resource/This server",
      subject: "iam@user.me",
      audience: "Client_Identity" // this should be provided by client
    };
    var verifyOptions = {
      issuer: $Option.issuer,
      subject: $Option.subject,
      audience: $Option.audience,
      expiresIn: "30d",
      algorithm: ["RS256"]
    };
    try {
      return jwt.verify(token, publicKEY, verifyOptions);
    } catch (err) {
      return false;
    }
  },
  decode: token => {
    return jwt.decode(token, { complete: true });
    //returns null if token is invalid
  }
*/
