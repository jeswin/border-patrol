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