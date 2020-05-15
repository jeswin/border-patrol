import { IAppConfig } from "../types";

let config: IAppConfig;

export function init(c: IAppConfig) {
  config = c;

  // Set some defaults.
  if (config.cookieName === undefined) {
    config.cookieName = "border-patrol-jwt";
  }

  if (config.cookies === undefined) {
    config.cookies = { maxAge: 24 * 60 * 60 };
  }
}

export function get(): IAppConfig {
  return config;
}
