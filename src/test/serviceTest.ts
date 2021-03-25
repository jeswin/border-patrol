import pg = require("pg");
import { startApp } from "..";
import { IDbConfig } from "psychopiggy";

import * as oauthAPIModule from "../api/oauth";
import * as oauthMocks from "./mocks/api/oauth";
import * as githubModule from "../domain/providers/github";
import * as githubMocks from "./mocks/domain/providers/github";
import * as userModule from "../domain/user";
import * as userMocks from "./mocks/domain/user";
import * as kvstoreModule from "../domain/user/kvstore";
import * as kvstoreMocks from "./mocks/domain/user/kvstore";
import * as jwtModule from "../utils/jwt";
import * as jwtMocks from "./mocks/utils/jwt";

import monkeyPatch from "./monkeyPatch";
import got from "got";
import { promisify } from "util";
import should = require("should");
import { writeSampleData, selectAndMatchRows } from "./utils/db";
import { getResponse } from "./utils/http";

const { Cookie, CookieJar } = require("tough-cookie");

let app: any;

export default function run(
  dbConfig: IDbConfig,
  domain: string,
  port: number,
  configDir: string
) {
  describe("service", async () => {
    let app: any;
    let port: number = 0;

    before(async () => {
      const service = await startApp(port, configDir);
      app = service.listen();
      port = app.address().port;
    });

    it("says userid is unavailable", async () => {
      const pool = new pg.Pool(dbConfig);
      await pool.query(`
        INSERT INTO "user"
          (id, name, status, timestamp)
          VALUES('jeswin', 'Jeswin Kumar', 'active', ${Date.now()});
      `);
      const response = await got(`http://${domain}:${port}/user-ids/jeswin`);
      response.statusCode.should.equal(200);
      JSON.parse(response.body).should.deepEqual({
        success: true,
        result: {
          available: false,
        },
      });
    });

    it("says available userid is available", async () => {
      const response = await got(`http://${domain}:${port}/user-ids/alice`);
      response.statusCode.should.equal(200);
      JSON.parse(response.body).should.deepEqual({
        success: true,
        result: {
          available: true,
        },
      });
    });

    it("redirects to connect", async () => {
      const response = await got(
        `http://${domain}:${port}/authenticate/github?success=http://${domain}:${port}/success&newuser=http://${domain}:${port}/newuser`,
        { followRedirect: false }
      );
      response.headers.should.not.be.empty();
      if (response.headers) {
        (response.headers as any)["set-cookie"].should.containEql(
          `border-patrol-success-redirect=http://${domain}:${port}/success; path=/; domain=${domain}`
        );
        (response.headers as any)["set-cookie"].should.containEql(
          `border-patrol-newuser-redirect=http://${domain}:${port}/newuser; path=/; domain=${domain}`
        );
        response.body.should.equal(
          `Redirecting to <a href="/connect/github">/connect/github</a>.`
        );
      }
    });

    it("gets tokens", async () => {
      await monkeyPatch(
        oauthAPIModule,
        oauthAPIModule.handleProviderCallback,
        oauthMocks.handleProviderCallback,
        async () => {
          return await monkeyPatch(
            githubModule,
            githubModule.getJwtAndTokensWithGrant,
            githubMocks.getJwtAndTokensWithGrant,
            async () => {
              const cookieJar = new CookieJar();
              const setCookie = promisify(cookieJar.setCookie.bind(cookieJar));

              await setCookie(
                `border-patrol-success-redirect=http://${domain}:${port}/success`,
                `http://${domain}:${port}`
              );

              await setCookie(
                `border-patrol-newuser-redirect=http://${domain}:${port}/newuser`,
                `http://${domain}:${port}`
              );

              const response = await got(
                `http://${domain}:${port}/oauth/token/github`,
                { cookieJar, followRedirect: false }
              );

              response.headers.should.not.be.empty();

              const cookies: any[] =
                response.headers["set-cookie"] instanceof Array
                  ? response.headers["set-cookie"].map(Cookie.parse)
                  : [Cookie.parse(response.headers["set-cookie"])];

              const jwtCookie = cookies.find(
                (x: any) => x.key === "border-patrol-jwt"
              );

              should.exist(jwtCookie, "border-patrol-jwt cookie is missing.");
              jwtCookie.value.should.equal("some_jwt");

              response.body.should.equal(
                `Redirecting to <a href="http://${domain}:${port}/success">http://${domain}:${port}/success</a>.`
              );
            }
          );
        }
      );
    });

    it("creates a user", async () => {
      await monkeyPatch(
        jwtModule,
        jwtModule.verify,
        jwtMocks.verify,
        async () => {
          await monkeyPatch(
            userModule,
            userModule.createUser,
            userMocks.createUser,
            async () => {
              const response = await got(`http://${domain}:${port}/users`, {
                method: "POST",
                body: JSON.stringify({ userId: "jeswin" }),
                headers: { "border-patrol-jwt": "some_jwt" },
              });

              const cookies: any[] =
                response.headers["set-cookie"] instanceof Array
                  ? response.headers["set-cookie"].map(Cookie.parse)
                  : [Cookie.parse(response.headers["set-cookie"])];

              const jwtCookie = cookies.find(
                (x: any) => x.key === "border-patrol-jwt"
              );

              should.exist(jwtCookie, "border-patrol-jwt cookie is missing.");
              jwtCookie.value.should.equal("some_other_jwt");

              JSON.parse(response.body).should.deepEqual({
                success: true,
                result: {
                  "border-patrol-jwt": "some_other_jwt",
                },
              });
            }
          );
        }
      );
    });

    it("deletes a user", async () => {
      await writeSampleData(dbConfig);
      const response = await got(
        `http://${domain}:${port}/admin/users/jeswin`,
        {
          method: "DELETE",
          headers: {
            "border-patrol-admin-key": "secret",
          },
        }
      );

      response.statusCode.should.equal(200);
      JSON.parse(response.body).should.deepEqual({
        success: true,
      });

      // Make sure the data is gone.
      await selectAndMatchRows(
        `SELECT * FROM "user"`,
        1,
        [
          {
            index: 0,
            values: {
              id: "eddie",
              name: "Eddie Noname",
              status: "active",
            },
          },
        ],
        dbConfig
      );
    });

    it("does not delete a user if adminKey is incorrect", async () => {
      await writeSampleData(dbConfig);

      const promisedResponse = got(
        `http://${domain}:${port}/admin/users/jeswin`,
        {
          method: "DELETE",
          headers: {
            "border-patrol-admin-key": "something",
          },
        }
      );

      const response = await getResponse(promisedResponse);
      response.statusCode.should.equal(401);
      JSON.parse(response.body).should.deepEqual({
        success: false,
        error: "Unauthorized.",
      });

      // Make sure the data is still there.
      await selectAndMatchRows(`SELECT * FROM "user"`, 2, [], dbConfig);
    });

    it("adds a key value pair", async () => {
      await monkeyPatch(
        jwtModule,
        jwtModule.verify,
        jwtMocks.verify,
        async () => {
          await monkeyPatch(
            kvstoreModule,
            kvstoreModule.createKeyValuePair,
            kvstoreMocks.createKeyValuePair,
            async () => {
              const response = await got(
                `http://${domain}:${port}/me/kvstore`,
                { method: "POST", headers: { "border-patrol-jwt": "some_jwt" } }
              );
              JSON.parse(response.body).should.deepEqual({ success: true });
            }
          );
        }
      );
    });
  });
}
