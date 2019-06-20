import pg = require("pg");
import { join } from "path";
import { readFileSync } from "fs";
import { IDbConfig } from "psychopiggy";
import * as userModule from "../domain/user";
import * as githubModule from "../domain/oauth/github";
import * as githubAPI from "../domain/oauth/github/api";

export default function run(dbConfig: IDbConfig, configDir: string) {
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

    it("user.getUserId returns userid with provider credentials", async () => {
      await writeSampleData();
      const result = await userModule.getUserId("jeswin", "github");
      result.should.deepEqual({ isValidUser: true, userId: "jeswin" });
    });

    it("user.getUserId returns false with invalid provider credentials", async () => {
      await writeSampleData();
      const result = await userModule.getUserId("alice", "github");
      result.should.deepEqual({ isValidUser: false });
    });

    it("user.getRoles returns roles", async () => {
      await writeSampleData();
      const result = await userModule.getRoles("jeswin");
      result.should.deepEqual(["coreteam", "admin"]);
    });

    it("user.getRoles returns nothing for missing user", async () => {
      await writeSampleData();
      const result = await userModule.getRoles("alice");
      result.should.deepEqual([]);
    });

    it("user.getTokensByProviderCredentials returns tokens", async () => {
      await writeSampleData();
      const result = await userModule.getTokensByProviderCredentials(
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
          dashboard: "yes"
        }
      });
    });

    it("user.getTokensForUser returns tokens", async () => {
      await writeSampleData();
      const result = await userModule.getTokensForUser("jeswin");
      result.should.deepEqual({
        userId: "jeswin",
        roles: "coreteam,admin",
        full: "yes",
        dashboard: "yes"
      });
    });

    it("user.getTokensForUser returns tokens without roles", async () => {
      await writeSampleData();
      const result = await userModule.getTokensForUser("alice");
      result.should.deepEqual({ userId: "alice" });
    });

    it("user.createUser creates a user", async () => {
      const result = await userModule.createUser("jeswin", "jeswin", "github");
      (result as any).jwt = "something";
      result.should.deepEqual({
        created: true,
        jwt: "something",
        tokens: {
          userId: "jeswin",
          providerUserId: "jeswin",
          provider: "github"
        }
      });
    });

    it("user.createUser doesn't overwrite existing user", async () => {
      await writeSampleData();
      const result = await userModule.createUser("jeswin", "jeswin", "github");
      result.should.deepEqual({
        created: false,
        reason: "User already exists."
      });
    });

    it("github.getTokensByAccessToken returns tokens", async () => {
      await writeSampleData();
      const originalGetUser: typeof githubAPI.getUser = githubAPI.getUser;

      (githubAPI as any).getUser = async (token: string) =>
        token === "test_token"
          ? { login: "jeswin" }
          : { error: "Invalid token." };

      const result = await githubModule.getTokensByAccessToken("test_token");
      (result as any).jwt = "something";
      result.should.deepEqual({
        oauthSuccess: true,
        isValidUser: true,
        jwt: "something",
        tokens: {
          userId: "jeswin",
          roles: "coreteam,admin",
          full: "yes",
          dashboard: "yes",
          providerUserId: "jeswin",
          provider: "github"
        }
      });

      (githubAPI as any).getUser = originalGetUser;
    });

    it("github.getTokensByAccessToken returns tokens for missing user", async () => {
      await writeSampleData();
      const originalGetUser: typeof githubAPI.getUser = githubAPI.getUser;

      (githubAPI as any).getUser = async (token: string) =>
        token === "test_token"
          ? { login: "alice" }
          : { error: "Invalid token." };

      const result = await githubModule.getTokensByAccessToken("test_token");
      (result as any).jwt = "something";
      result.should.deepEqual({
        oauthSuccess: true,
        isValidUser: false,
        jwt: "something",
        tokens: { providerUserId: "alice", provider: "github" }
      });

      (githubAPI as any).getUser = originalGetUser;
    });

    it("user.addKeyValuePair writes data", async () => {
      await writeSampleData();
      const result = await userModule.addKeyValuePair(
        "jeswin",
        "publickey_1",
        "abcd",
        "pubkey"
      );
      result.should.deepEqual({ saved: true });
    });

    it("user.addKeyValuePair skips when user is missing", async () => {
      await writeSampleData();
      const result = await userModule.addKeyValuePair(
        "alicecooper",
        "publickey_1",
        "abcd",
        "pubkey"
      );
      result.should.deepEqual({ saved: false, reason: "User does not exist." });
    });
  });
}
