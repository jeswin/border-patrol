export interface IAppConfig {
  domain: string;
  sessionKeys: string;
  cookies: {
    httpOnly: boolean;
    maxAge: number;
  };
  enablePasswordAuth: boolean;
  enabledProviders: string[];
}

export interface IJwtConfig {
  publicKey: string;
  privateKey: string;
  signOptions: object;
}