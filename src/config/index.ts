export interface IConfig {
  domain: string;
  cookies: {
    httpOnly: boolean;
    maxAge: number;
  }
}

let config: IConfig;

export function init(c: IConfig) {
  config = c;
}

export function get(): IConfig {
  return config;
}
