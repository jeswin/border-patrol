#!/usr/bin/env node

import Koa = require("koa");
import session = require("koa-session");
import mount = require("koa-mount");
import Router = require("koa-router");
import bodyParser = require("koa-bodyparser");
import yargs = require("yargs");
import { join } from "path";

import { handleProviderCallback } from "./api/oauth";
import * as db from "./db";
import * as jwt from "./utils/jwt";
import * as config from "./config";
import { authenticate } from "./api/authenticate";
import { IAppConfig, IJwtConfig } from "./types";
import { getUserIdAvailability } from "./api/userIds";
import { createUser } from "./api/users";
import { createKeyValuePair } from "./api/me";
import { login } from "./api/localAccount";

const packageJson = require("../package.json");

const grant = require("grant-koa");

const argv = yargs.options({
  c: { type: "string", alias: "config" },
  p: { type: "number", default: 8080, alias: "port" },
  v: { type: "boolean", alias: "version" },
}).argv;

export async function startApp(port: number, configDir: string) {
  const appConfig: IAppConfig = require(join(configDir, "app.js"));
  const dbConfig = require(join(configDir, "pg.js"));
  const jwtConfig: IJwtConfig = require(join(configDir, "jwt.js"));
  const oauthConfig = require(join(configDir, "oauth.js"));

  // Init utils
  db.init(dbConfig);
  jwt.init(jwtConfig);
  config.init(appConfig);

  // Set up routes
  const router = new Router();

  /* Entry point for all auth services */
  appConfig.enabledProviders.forEach((service) => {
    router.get(`/authenticate/${service}`, authenticate(service));
  });

  /* OAuth services need a callback */
  appConfig.enabledProviders.forEach((oauthService) =>
    router.get(
      `/oauth/token/${oauthService}`,
      async (ctx: Router.RouterContext) =>
        await handleProviderCallback(ctx, oauthService)
    )
  );

  /* Check if a user-id is available */
  router.get(`/user-ids/:userId`, getUserIdAvailability);

  /* Create a new user. */
  router.post(`/users`, createUser);

  /* Add a key value pair for a user */
  router.post(`/me/kvstore`, createKeyValuePair);

  if (appConfig.enablePasswordAuth) {
    router.post("/login", login);
  }

  for (const key in oauthConfig) {
    if (key !== "defaults") {
      oauthConfig[key].callback = `/oauth/token/${key}`;
    }
  }

  // Start app
  var app = new Koa();
  app.use(bodyParser());
  app.keys = appConfig.sessionKeys.split(",");
  app.use(session(app));
  app.use(mount(grant(oauthConfig)));
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(port);

  return app;
}

if (require.main === module) {
  // Print the version and exit
  if (argv.v) {
    console.log(packageJson.version);
  } else {
    if (!argv.p) {
      console.log("The port should be specified with the -p option.");
      process.exit(1);
    }

    if (!argv.c) {
      console.log(
        "The configuration directory should be specified with the -c option."
      );
      process.exit(1);
    }

    const configDir = argv.c;
    const port = argv.p;

    startApp(port, configDir);
    console.log(`listening on port ${port}`);
  }
}
