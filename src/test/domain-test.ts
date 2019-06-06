import "mocha";
import "should";
import pg = require("pg");
import { join } from "path";
import { init } from "../";
import { readFileSync } from "fs";
import request = require("supertest");
import { IDbConfig } from "psychopiggy";
import * as userModule from "../domain/user";
const shouldLib = require("should");

export default function run(dbConfig: IDbConfig, configDir: string) {
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
    const result = await userModule.getTokensByProviderCredentials("jeswin", "github");
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
}
