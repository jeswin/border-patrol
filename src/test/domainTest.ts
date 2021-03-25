import { IDbConfig } from "psychopiggy";
import * as userModule from "../domain/user";
import * as localAccountModule from "../domain/localAccount";
import * as githubModule from "../domain/providers/github";
import * as githubAPI from "../domain/providers/github/api";
import { selectAndMatchRows, writeSampleData } from "./utils/db";

export default function run(dbConfig: IDbConfig, configDir: string) {
  describe("domain", async () => {
    it("user.getUserIdAvailability() returns false when user exists", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getUserIdAvailability("jeswin");
      result.should.deepEqual({ available: false });
    });

    it("user.getUserIdAvailability() returns true when user doesn't exist", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getUserIdAvailability("alice");
      result.should.deepEqual({ available: true });
    });

    it("user.getUserId() returns userid with provider credentials", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getUserId("jeswin", "github");
      result.should.deepEqual({ foundUser: true, userId: "jeswin" });
    });

    it("user.getUserId() returns false with invalid provider credentials", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getUserId("alice", "github");
      result.should.deepEqual({ foundUser: false });
    });

    it("user.getRoles() returns roles", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getRoles("jeswin");
      result.should.deepEqual(["coreteam", "admin"]);
    });

    it("user.getRoles() returns nothing for missing user", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getRoles("alice");
      result.should.deepEqual([]);
    });

    it("user.getJwtAndTokensByProviderIdentity() returns tokens", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.getJwtAndTokensByProviderIdentity(
        "jeswin",
        "github"
      );
      result.jwt = "something";
      result.should.deepEqual({
        foundUser: true,
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
      await writeSampleData(dbConfig);
      const result = await userModule.getTokensForUser("jeswin");
      result.should.deepEqual({
        userId: "jeswin",
        roles: "coreteam,admin",
        full: "yes",
        dashboard: "yes",
      });
    });

    it("user.getTokensForUser returns tokens without roles", async () => {
      await writeSampleData(dbConfig);
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

      await selectAndMatchRows(
        `SELECT * FROM "user"`,
        1,
        [
          {
            index: 0,
            values: { id: "jeswin" },
          },
        ],
        dbConfig
      );
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

      await selectAndMatchRows(
        `SELECT * FROM "user"`,
        1,
        [
          {
            index: 0,
            values: { id: "jeswin" },
          },
        ],
        dbConfig
      );
      await selectAndMatchRows(
        `SELECT * FROM "local_user_auth"`,
        1,
        [
          {
            index: 0,
            values: { user_id: "jeswin" },
          },
        ],
        dbConfig
      );
    });

    it("user.createUser() doesn't overwrite existing user", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.createUser("jeswin", "jeswin", "github");
      result.should.deepEqual({
        created: false,
        reason: "User already exists.",
      });
    });

    it("user.createUser() verifies min userId length", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.createUser("yo", "jeswin", "github");
      result.should.deepEqual({
        created: false,
        reason: "UserId should be at least 4 characters long.",
      });
    });

    it("user.createUser() verifies max userId length", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.createUser(
        "thisisaverylongusername",
        "jeswin",
        "github"
      );
      result.should.deepEqual({
        created: false,
        reason: "UserId should be at most 12 characters long.",
      });
    });

    it("localAccount.createLocalUser() doesn't overwrite existing user", async () => {
      await writeSampleData(dbConfig);
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
      await writeSampleData(dbConfig);
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
          fetchedProviderUser: true,        
          foundUser: true,
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
      await writeSampleData(dbConfig);
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
          fetchedProviderUser: true,
          foundUser: false,
          jwt: "something",
          tokens: { providerUserId: "alice", provider: "github" },
        });
      } finally {
        (githubAPI as any).getUser = originalGetUser;
      }
    });

    it("user.createKeyValuePair() inserts data", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.createKeyValuePair(
        "jeswin",
        "region",
        "india",
        "locations"
      );
      result.should.deepEqual({ created: true, edit: "insert" });

      await selectAndMatchRows(
        `SELECT * FROM "kvstore"`,
        2,
        [
          {
            index: 1,
            values: { key: "region" },
          },
        ],
        dbConfig
      );
    });

    it("user.createKeyValuePair() updates data", async () => {
      await writeSampleData(dbConfig);
      const result = await userModule.createKeyValuePair(
        "jeswin",
        "group",
        "india",
        "access"
      );
      result.should.deepEqual({ created: true, edit: "update" });

      await selectAndMatchRows(
        `SELECT * FROM "kvstore"`,
        1,
        [
          {
            index: 0,
            values: { tag: "access" },
          },
        ],
        dbConfig
      );
    });
  });
}
