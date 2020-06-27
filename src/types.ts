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
  adminKey?: string;
}

export interface IJwtConfig {
  publicKey: string;
  privateKey: string;
  signOptions: object;
}

export interface IOAuthConfig {
  defaults: {
    protocol: "http";
    host: string;
    transport: "session";
    state: true;
  };
  github: {
    key: string;
    secret: string;
  };
}

export type APIResult<T> =
  | {
      success: false;
      error: string;
      errorCode: string;
    }
  | {
      success: true;
      result: T;
    };
