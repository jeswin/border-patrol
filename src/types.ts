export interface IAppConfig {
  domain: string;
  sessionKeys: string;
  cookies: {
    httpOnly: boolean;
    maxAge: number;
  };
  enablePasswordAuth: boolean;
  enabledProviders: string[];
  account?: {
    minUserIdLength?: number;
    maxUserIdLength?: number;
  };
}

export interface IJwtConfig {
  publicKey: string;
  privateKey: string;
  signOptions: object;
}
