import * as psychopiggy from "psychopiggy";

export interface IPGConfig {
  database: string;
  host: string;
  password: string;
  port: number;
  user: string;
}

let config: IPGConfig;

export async function init(c: IPGConfig) {
  if (!config) {
    psychopiggy.createPool(c);
    config = c;
  } else {
    throw("DB config has already been initialized.");
  }
}

export function getConfig() {
  return config;
}

export function getPool() {
  return psychopiggy.getPool(config);
}