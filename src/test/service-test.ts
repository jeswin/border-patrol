import "mocha";
import "should";
import pg = require("pg");
import { join } from "path";
import { init } from "../";
import { readFileSync } from "fs";
import request = require("supertest");
import { IDbConfig } from "psychopiggy";

const shouldLib = require("should");

let app: any;

export default function run(dbConfig: IDbConfig, configDir: string) {
  before(async () => {
    const service = await init(configDir);
    app = service.listen();
  });

  it("says userid exists", async () => {
    const pool = new pg.Pool(dbConfig);
    await pool.query(`
      INSERT INTO "user" 
        (id, first_name, last_name, created_at, updated_at) 
        VALUES('jeswin', 'Jeswin', 'Kumar', ${Date.now()}, ${Date.now()});
    `);
    const response = await request(app).get("/user-ids/jeswin");
    response.status.should.equal(200);
    JSON.parse(response.text).should.deepEqual({
      exists: true
    });
  });

  it("says missing userid is missing", async () => {
    const response = await request(app).get("/user-ids/alice");
    response.status.should.equal(200);
    JSON.parse(response.text).should.deepEqual({
      exists: false
    });
  });
}
