import { IDbConfig } from "psychopiggy";

import pg = require("pg");
import { readFileSync } from "fs";
import { join } from "path";

export async function writeSampleData(dbConfig: IDbConfig) {
  const pool = new pg.Pool(dbConfig);

  const sampleDataSQL = readFileSync(
    join(__dirname, "./sample-data.sql")
  ).toString();

  await pool.query(sampleDataSQL);
}

export async function selectAndMatchRows(
  query: string,
  count: number,
  rowsToMatch: {
    index: number;
    values: any;
  }[],
  dbConfig: IDbConfig
) {
  const pool = new pg.Pool(dbConfig);
  const { rows } = await pool.query(query);
  rows.length.should.equal(count);

  for (const row of rowsToMatch) {
    Object.keys(row.values).forEach((k) => {
      row.values[k].should.equal(rows[row.index][k]);
    });
  }
}
