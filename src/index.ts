#!/usr/bin/env node

import Koa = require("koa");
import session = require("koa-session");
import mount = require("koa-mount");
import Router = require("koa-router");
import bodyParser = require("koa-bodyparser");
import { getTokens } from "./api/oauth";
import { join } from "path";
import * as db from "./db";
import * as jwt from "./utils/jwt";
import * as config from "./config";
import { authenticate } from "./api/authenticate";
import { getUsernameAvailability, createUser } from "./api/user";

const grant = require("grant-koa");

async function init() {
  // Make sure we have all config settings
  if (!process.env.PORT) {
    throw new Error("The port should be specified in env.PORT");
  }

  if (!process.env.DOMAIN) {
    throw new Error("The parent domain should be specified in env.DOMAIN");
  }

  if (!process.env.CONFIG_DIR) {
    throw new Error(
      "The configuration directory should be specified in env.CONFIG_DIR"
    );
  }

  // Load all configs
  const configDir = process.env.CONFIG_DIR;
  const oauthConfig = require(join(configDir, "oauth.js"));
  const dbConfig = require(join(configDir, "db.js"));
  const jwtConfig = require(join(configDir, "jwt.js"));
  const appConfig = require(join(configDir, "app.js"));

  // Init utils
  db.init(dbConfig);
  jwt.init(jwtConfig);
  config.init({
    domain: process.env.DOMAIN,
    cookies: appConfig.cookies
  });

  // Set up routes
  const router = new Router();

  // Define routes for enabled services
  const enablePasswordAuth: boolean =
    process.env.ENABLE_PASSWORD_AUTH &&
    ["true", "yes"].includes(process.env.ENABLE_PASSWORD_AUTH)
      ? true
      : false;

  const enabledOAuthServices = process.env.ENABLED_OAUTH_SERVICES
    ? process.env.ENABLED_OAUTH_SERVICES.split(",")
    : ["github", "google"];

  const allServices = (enablePasswordAuth ? ["login"] : []).concat(
    enabledOAuthServices
  );

  /* Entry point for all auth services */
  allServices.forEach(service => {
    router.get(`/authenticate/${service}`, authenticate(service));
  });

  /* OAuth services need a callback */
  enabledOAuthServices.forEach(oauthService => {
    router.get(`/oauth/token/${oauthService}`, getTokens(oauthService));
  });

  /* Check if a username is available */
  router.get(`/usernames/:username`, getUsernameAvailability);

  /* Create a new user */
  router.post(`/users`, createUser);

  // Start app
  var app = new Koa();
  app.use(bodyParser());
  app.keys = appConfig.APP_KEYS.split(",");
  app.use(session(app));
  app.use(mount(grant(oauthConfig)));
  app.use(router.routes());
  app.use(router.allowedMethods());
  
  const port = process.env.PORT;
  app.listen(parseInt(port));

  console.log(`listening on port ${port}`);
}

init();
