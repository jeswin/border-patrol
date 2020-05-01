import pg = require("pg");
import { join } from "path";
import { readFileSync } from "fs";
import { IDbConfig } from "psychopiggy";
import * as userModule from "../domain/user";
import * as localAccountModule from "../domain/localAccount";
import * as githubModule from "../domain/providers/github";
import * as githubAPI from "../domain/providers/github/api";

export default function run(dbConfig: IDbConfig, configDir: string) {
  async function selectAndMatchRows(
    table: string,
    count: number,
    rowToMatch: number,
    props: any
  ) {
    const pool = new pg.Pool(dbConfig);
    const { rows } = await pool.query(`SELECT * FROM "${table}"`);
    rows.length.should.equal(count);
    Object.keys(props).forEach((k) => {
      props[k].should.equal(rows[rowToMatch][k]);
    });
  }

  describe("domain", async () => {
    async function writeSampleData() {
      const pool = new pg.Pool(dbConfig);

      const sampleDataSQL = readFileSync(
        join(__dirname, "./sample-data.sql")
      ).toString();

      await pool.query(sampleDataSQL);
    }

    it("user.getUserIdAvailability() returns true when user exists", async () => {
      await writeSampleData();
      const result = await userModule.getUserIdAvailability("jeswin");
      result.should.deepEqual({ exists: true });
    });

    it("user.getUserIdAvailability() returns false when user doesn't exist", async () => {
      await writeSampleData();
      const result = await userModule.getUserIdAvailability("alice");
      result.should.deepEqual({ exists: false });
    });

    it("user.getUserId() returns userid with provider credentials", async () => {
      await writeSampleData();
      const result = await userModule.getUserId("jeswin", "github");
      result.should.deepEqual({ isValidUser: true, userId: "jeswin" });
    });

    it("user.getUserId() returns false with invalid provider credentials", async () => {
      await writeSampleData();
      const result = await userModule.getUserId("alice", "github");
      result.should.deepEqual({ isValidUser: false });
    });

    it("user.getRoles() returns roles", async () => {
      await writeSampleData();
      const result = await userModule.getRoles("jeswin");
      result.should.deepEqual(["coreteam", "admin"]);
    });

    it("user.getRoles() returns nothing for missing user", async () => {
      await writeSampleData();
      const result = await userModule.getRoles("alice");
      result.should.deepEqual([]);
    });

    it("user.getJwtAndTokensByProviderIdentity() returns tokens", async () => {
      await writeSampleData();
      const result = await userModule.getJwtAndTokensByProviderIdentity(
        "jeswin",
        "github"
      );
      result.jwt = "something";
      result.should.deepEqual({
        isValidUser: true,
        jwt: "something",
        tokens: {
          userId: "jeswin",
          providerUserId: "jeswin",
          provider: "github",
          roles: "coreteam,admin",
          full: "yes",
          dashboard: "yes",
        },
      });
    });

    it("user.getTokensForUser() returns tokens", async () => {
      await writeSampleData();
      const result = await userModule.getTokensForUser("jeswin");
      result.should.deepEqual({
        userId: "jeswin",
        roles: "coreteam,admin",
        full: "yes",
        dashboard: "yes",
      });
    });

    it("user.getTokensForUser returns tokens without roles", async () => {
      await writeSampleData();
      const result = await userModule.getTokensForUser("alice");
      result.should.deepEqual({ userId: "alice" });
    });

    it("user.createUser() creates a user", async () => {
      const result = await userModule.createUser("jeswin", "jeswin", "github");
      (result as any).jwt = "something";
      result.should.deepEqual({
        created: true,
        jwt: "something",
        tokens: {
          userId: "jeswin",
          providerUserId: "jeswin",
          provider: "github",
        },
      });

      await selectAndMatchRows("user", 1, 0, { id: "jeswin" });
    });

    it("localAccount.createLocalUser() creates a local user", async () => {
      const result = await localAccountModule.createLocalUser(
        "jeswin",
        "secret"
      );
      (result as any).jwt = "something";
      result.should.deepEqual({
        created: true,
        jwt: "something",
        tokens: {
          userId: "jeswin",
          providerUserId: "jeswin",
          provider: "local",
        },
      });

      await selectAndMatchRows("user", 1, 0, { id: "jeswin" });
      await selectAndMatchRows("local_user_auth", 1, 0, { user_id: "jeswin" });
    });

    it("user.createUser() doesn't overwrite existing user", async () => {
      await writeSampleData();
      const result = await userModule.createUser("jeswin", "jeswin", "github");
      result.should.deepEqual({
        created: false,
        reason: "User already exists.",
      });
    });

    it("localAccount.createLocalUser() doesn't overwrite existing user", async () => {
      await writeSampleData();
      const result = await localAccountModule.createLocalUser(
        "jeswin",
        "secret"
      );
      result.should.deepEqual({
        created: false,
        reason: "Could not create new local user.",
      });
    });

    it("github.getJwtAndTokensWithGrant() returns tokens", async () => {
      await writeSampleData();
      const originalGetUser: typeof githubAPI.getUser = githubAPI.getUser;

      (githubAPI as any).getUser = async (token: string) =>
        token === "test_token"
          ? { login: "jeswin" }
          : { error: "Invalid token." };

      try {
        const result = await githubModule.getJwtAndTokensWithGrant({
          response: { access_token: "test_token" },
        });
        (result as any).jwt = "something";

        result.should.deepEqual({
          success: true,
          isValidUser: true,
          jwt: "something",
          tokens: {
            userId: "jeswin",
            roles: "coreteam,admin",
            full: "yes",
            dashboard: "yes",
            providerUserId: "jeswin",
            provider: "github",
          },
        });
      } finally {
        (githubAPI as any).getUser = originalGetUser;
      }
    });

    it("github.getJwtAndTokensWithGrant() returns tokens for missing user", async () => {
      await writeSampleData();
      const originalGetUser: typeof githubAPI.getUser = githubAPI.getUser;

      (githubAPI as any).getUser = async (token: string) =>
        token === "test_token"
          ? { login: "alice" }
          : { error: "Invalid token." };

      try {
        const result = await githubModule.getJwtAndTokensWithGrant({
          response: { access_token: "test_token" },
        });
        (result as any).jwt = "something";
        result.should.deepEqual({
          success: true,
          isValidUser: false,
          jwt: "something",
          tokens: { providerUserId: "alice", provider: "github" },
        });
      } finally {
        (githubAPI as any).getUser = originalGetUser;
      }
    });

    it("user.createKeyValuePair() inserts data", async () => {
      await writeSampleData();
      const result = await userModule.createKeyValuePair(
        "jeswin",
        "region",
        "india",
        "locations"
      );
      result.should.deepEqual({ created: true, edit: "insert" });

      await selectAndMatchRows("kvstore", 2, 1, { key: "region" });
    });

    it("user.createKeyValuePair() updates data", async () => {
      await writeSampleData();
      const result = await userModule.createKeyValuePair(
        "jeswin",
        "group",
        "india",
        "access"
      );
      result.should.deepEqual({ created: true, edit: "update" });

      await selectAndMatchRows("kvstore", 1, 0, { tag: "access" });
    });
  });
}
