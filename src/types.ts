export interface IAppConfig {
  domain: string;
  sessionKeys: string;
  cookies: {
    httpOnly: boolean;
    maxAge: number;
  };
  enablePasswordAuth: boolean;
  enabledOAuthServices: string[];
}

export interface IJWTConfig {
  publicKey: string;
  privateKey: string;
  signOptions: object;
}