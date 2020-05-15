import { IOAuthConfig } from "../types";

let config: IOAuthConfig;

export function init(c: IOAuthConfig) {
  config = c;
}

export function get(): IOAuthConfig {
  return config;
}
