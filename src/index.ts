import {Configuration, OpenAIApi} from 'openai';
import * as fs from 'fs';
import {DB} from './db';
import {displayQueryResult} from './displayQueryResult';
import {GPT} from './openai';

// Connect to database and perform query

// Display the query result in a table
const question = `
* List the first and last names of actors, and the name of the movie who have appeared in films rated 'PG' for 15 actors
    `;
const fname = 'prompts/pagila';
const background = fs.readFileSync(fname, 'utf-8');

async function main() {
  const db = new DB();
  // DB
  const schema = await db.shortSchema();
  // console.log(schema);

  // GPT
  const gpt = new GPT();
  const query = schema + background + question;
  // console.log('query:', query);
  const gptResult = await gpt.fetch(query);
	console.log('gptResult:', gptResult);

  const rows = await db.runQuery(gptResult as string);
  // console.log(rows);
  displayQueryResult(rows);
}

main();
