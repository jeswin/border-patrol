export interface IConfig {
  domain: string;
}

let config: IConfig;

export function init(c: IConfig) {
  config = c;
}

export function get(): IConfig {
  return config;
}
