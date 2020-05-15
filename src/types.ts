export interface IAppConfig {
  domain: string;
  sessionKeys: string;
  cookies: {
    maxAge: number;
  };
  enablePasswordAuth: boolean;
  enabledProviders: string[];
  account?: {
    minUserIdLength?: number;
    maxUserIdLength?: number;
  };
  cookieName: string;
}

export interface IJwtConfig {
  publicKey: string;
  privateKey: string;
  signOptions: object;
}
