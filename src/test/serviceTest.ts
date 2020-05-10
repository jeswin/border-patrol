import pg = require("pg");
import { startApp } from "..";
import request = require("supertest");
import { IDbConfig } from "psychopiggy";
import * as oauthAPIModule from "../api/oauth";
import * as githubModule from "../domain/providers/github";
import * as userModule from "../domain/user";
import * as jwtModule from "../utils/jwt";
import { RouterContext } from "koa-router";

let app: any;

export default function run(
  dbConfig: IDbConfig,
  port: number,
  configDir: string
) {
  describe("service", async () => {
    let app: any;

    before(async () => {
      const service = await startApp(port, configDir);
      app = service.listen();
    });

    it("says userid is unavailable", async () => {
      const pool = new pg.Pool(dbConfig);
      await pool.query(`
        INSERT INTO "user"
          (id, name, timestamp)
          VALUES('jeswin', 'Jeswin Kumar', ${Date.now()});
      `);
      const response = await request(app).get("/user-ids/jeswin");
      response.status.should.equal(200);
      JSON.parse(response.text).should.deepEqual({
        available: false,
      });
    });

    it("says available userid is available", async () => {
      const response = await request(app).get("/user-ids/alice");
      response.status.should.equal(200);
      JSON.parse(response.text).should.deepEqual({
        available: true,
      });
    });

    it("redirects to connect", async () => {
      const response = await request(app).get(
        "/authenticate/github?success=http://test.example.com/success&newuser=http://test.example.com/newuser"
      );
      response.header["set-cookie"].should.containEql(
        "border-patrol-success-redirect=http://test.example.com/success; path=/; domain=test.example.com"
      );
      response.header["set-cookie"].should.containEql(
        "border-patrol-newuser-redirect=http://test.example.com/newuser; path=/; domain=test.example.com"
      );
      response.text.should.equal(
        `Redirecting to <a href="/connect/github">/connect/github</a>.`
      );
    });

    it("gets tokens", async () => {
      // Mock a few things.
      const originalSetJwtAndIdentityCookie =
        oauthAPIModule.handleProviderCallback;

      const originalGetJwtAndTokensWithGrant =
        githubModule.getJwtAndTokensWithGrant;

      try {
        (oauthAPIModule as any).getTokens = (async (
          ctx: RouterContext,
          provider: string
        ) => {
          (ctx as any).session = {
            grant: { response: { access_token: "some_token" } },
          };
          return await originalSetJwtAndIdentityCookie(ctx, provider);
        }) as typeof originalSetJwtAndIdentityCookie;

        (githubModule as any).getJwtAndTokensWithGrant = (async () => ({
          isValidUser: false,
          success: true,
          jwt: "some_jwt",
          tokens: { userId: "some_userid" },
        })) as typeof originalGetJwtAndTokensWithGrant;

        const response = await request(app)
          .get("/oauth/token/github")
          .set("Cookie", [
            "border-patrol-success-redirect=http://test.example.com/success",
            "border-patrol-newuser-redirect=http://test.example.com/newuser",
          ]);

        const cookies = (response.header["set-cookie"] as Array<
          string
        >).flatMap((x) => x.split(";"));
        cookies.should.containEql("border-patrol-user-id=some_userid");
        cookies.should.containEql("border-patrol-domain=test.example.com");
        response.text.should.equal(
          `Redirecting to <a href="http://test.example.com/newuser">http://test.example.com/newuser</a>.`
        );
      } finally {
        (oauthAPIModule as any).setJwtAndIdentityCookie = originalSetJwtAndIdentityCookie;
        (githubModule as any).getJwtAndTokensWithGrant = originalGetJwtAndTokensWithGrant;
      }
    });

    it("creates a user", async () => {
      // Mock a few things.
      const originalVerify = jwtModule.verify;
      const originalCreateUser = userModule.createUser;

      try {
        (jwtModule as any).verify = (() => ({
          valid: true,
          value: {
            providerUserId: "jeswin",
            provider: "github",
          },
        })) as typeof originalVerify;

        (userModule as any).createUser = (async () => ({
          created: true,
          jwt: "some_other_jwt",
          tokens: { userId: "jeswin" },
        })) as typeof originalCreateUser;

        const response = await request(app)
          .post("/users")
          .send({ userId: "jeswin" })
          .set("border-patrol-jwt", "some_jwt");

        const cookies = (response.header["set-cookie"] as Array<
          string
        >).flatMap((x) => x.split(";"));
        cookies.should.containEql("border-patrol-jwt=some_other_jwt");
        cookies.should.containEql("border-patrol-domain=test.example.com");
        response.text.should.equal(
          `{"border-patrol-jwt":"some_other_jwt","border-patrol-user-id":"jeswin","border-patrol-domain":"test.example.com"}`
        );
      } finally {
        (jwtModule as any).verify = originalVerify;
        (userModule as any).createUser = originalCreateUser;
      }
    });

    it("adds a key value pair", async () => {
      // Mock a few things.
      const originalVerify = jwtModule.verify;
      const originalCreateKeyValuePair = userModule.createKeyValuePair;

      try {
        (jwtModule as any).verify = (() => ({
          valid: true,
          value: { userId: "jeswin" },
        })) as typeof originalVerify;

        (userModule as any).createKeyValuePair = (async () => ({
          created: true,
          edit: "insert",
        })) as typeof originalCreateKeyValuePair;

        const response = await request(app)
          .post("/me/kvstore")
          .set("border-patrol-jwt", "some_jwt");

        JSON.parse(response.text).should.deepEqual({ success: true });
      } finally {
        (jwtModule as any).verify = originalVerify;
        (userModule as any).createKeyValuePair = originalCreateKeyValuePair;
      }
    });
  });
}
