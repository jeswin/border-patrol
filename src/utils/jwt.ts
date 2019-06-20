import jwt = require("jsonwebtoken");
import { IJWTConfig } from "../types";

let config: IJWTConfig;

export function init(c: IJWTConfig) {
  if (!config) {
    config = c;
  } else {
    throw "JWT config has already been initialized.";
  }
}

export function sign(payload: any) {
  return jwt.sign(payload, config.privateKey, config.signOptions);
}

export type IJWT = {
  [key: string]: string;
};

export type IVerifiedInvalidJWT = {
  valid: false;
};

export type IVerifiedValidJWT = {
  valid: true;
  value: IJWT;
};

export type IVerifiedJWT = IVerifiedInvalidJWT | IVerifiedValidJWT;

export function verify(token: string): IVerifiedJWT {
  try {
    return {
      valid: true,
      value: jwt.verify(token, config.publicKey) as any
    };
  } catch {
    return { valid: false };
  }
}
