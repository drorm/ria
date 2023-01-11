import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'node:readline/promises';
import {tmpdir} from 'os';
import {writeFileSync, unlinkSync} from 'fs';
//const {tmpdir} = require('os');
import {Configuration, OpenAIApi} from 'openai';

const {spawn} = require('child_process');

import {DB} from './db';
import {displayQueryResult} from './displayQueryResult';
import {GPT} from './openai';
import {NlpCloud} from './nlpcloud';
import {settings} from './settings';

let log = console.log;
const pr: string = '> ';
const completer = (line: string) => {
  const completions = ['history', 'help', 'ask', 'fromfile'];
  const hits = completions.filter(c => c.startsWith(line));
  // Show all completions if none found
  return [hits.length ? hits : completions, line];
};
const fname = 'prompts/pagila';

const background = fs.readFileSync(fname, 'utf-8');
if (!('LESS' in process.env)) {
  process.env['LESS'] = '-SRF';
}

class RIA {
  homeDir: string = '';
  rl: any;
  histPath: string = '';
  schema: string = '';
  gpt = new GPT();
  nlpCloud = new NlpCloud();
  db = new DB();

  constructor() {
    this.init();
  }

  async init() {
    this.schema = await this.db.shortSchema();

    // console.log(schema);

    const histName = '.ria_hist';
    const homeDir = os.homedir();
    this.histPath = path.join(homeDir, histName);
    let historyLines: string[] = [];
    if (fs.existsSync(this.histPath)) {
      const savedLines = fs.readFileSync(this.histPath, 'utf8');
      historyLines = savedLines.split('\n').reverse();
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: 200,
      history: historyLines,
      terminal: true,
      completer,
      prompt: '> ',
    });
    this.rl.on('close', () => {
      log('Goodbye!');
      process.exit(0);
    });

    this.log('init', '');

    this.chat();
  }

  async chat() {
    try {
      await this.request();
    } catch (e) {
      log(e);
      this.exit();
    }
  }

  request() {
    // Initial prompt
    this.rl.prompt();

    this.rl.on('line', (line: string) => {
      // Every time we get a response
      this.rl.history.push(line);
      this.handleCommand(line);
      this.rl.prompt();
    });
  }

  showHelp() {
    log(`
    Hit tab twice at the beginning of line to show the list of commands.
    Use standar ^N ^P and arrows to go up and down in the history including across sessions.
      `);
  }

  error(message: string) {
    log(message);
  }

  handleCommand(line: string) {
    const args: string[] = line.toLowerCase().split(' ');
    if (args[0] == '') {
      return;
    }
    const command = args[0];
    fs.appendFileSync(this.histPath, `${line}\n`);

    switch (command) {
      case 'help':
        this.showHelp();
        break;
      case 'ask':
        args.shift(); // skip the term ask
        this.ask(args);
        break;
      case 'fromfile':
        args.shift(); // Just send a raw request
        this.fromfile(args);
        break;
      default:
        this.error(`Unknown command: '${command}'`);
        break;
    }
  }

  async fromfile(args: string[]) {
    // log('Chat got:', args);
    if (args[0] == '') {
      return;
    }

    let gptResult;
    const fname = args[0];
    args.shift();
    const userRequest = args.join(' ');

    try {
      const background = fs.readFileSync(fname, 'utf-8');
      const fullRequest = background + userRequest;
      gptResult = await this.gpt.fetch(fullRequest);
      /*
       * gptResult.completion.data format
				{
					...
					choices: [
						{
							text: `{"query": "SELECT * FROM film WHERE rating = 'PG'"}`,
							index: 0,
							logprobs: null,
							finish_reason: 'stop'
						}
					],
					usage: { prompt_tokens: 254, completion_tokens: 15, total_tokens: 269 }
				}
       */
      console.log(gptResult.choices[0].text);
      console.log('Tokens used:', gptResult.usage.total_tokens);
      this.log(fullRequest, gptResult);
      return gptResult.choices[0].text;

      // rows = await this.db.runQuery(gptResult as string);
    } catch (err) {
      log(err);
    }
  }

  async ask(args: string[]) {
    // log('Chat got:', args);
    const userRequest = args.join(' ');

    const fullRequest = this.schema + background + userRequest;
    let rows;
    let gptResult;

    try {
      // log('fullRequest:', fullRequest);
      gptResult = await this.gpt.fetch(fullRequest);
      const query = gptResult.choices[0].text;
      console.log('Tokens used:', gptResult.usage.total_tokens);
      log('gptResult:', query);

      rows = await this.db.runQuery(query as string);
    } catch (err) {
      log(err);
    }
    //console.log(rows);
    const out = await displayQueryResult(rows);
    //    this.lessView(out);
    this.log(userRequest, gptResult);
  }
  /**
   * Log the requests and responses to file
   */
  log(request: string, result: string | undefined) {
    const currentTimestamp = new Date().toLocaleString();
    if (request === 'init') {
      const separator = `\n\n#################################### ${currentTimestamp} ####################################\n`;
      const schemaDelim = '\n--------- Schema ------------------\n';
      const backgroundDelim = '\n--------- background ------------------\n';
      const output =
        separator + schemaDelim + this.schema + backgroundDelim + background;
      fs.appendFileSync(settings.LOG_FILE, output);
      return;
    }
    const separator = `\n\n==================================== ${currentTimestamp} ====================================\n`;
    const delim = '\n---------Response------------------';
    const output = separator + request + delim + result + delim;
    fs.appendFileSync(settings.LOG_FILE, output);
  }
  exit() {
    process.exit(0);
  }

  async lessView(inputString: string) {
    // Generate a path for the temporary file
    const tmpFile = `${tmpdir()}/less-view.tmp`;

    // Write the input string to the temporary file
    writeFileSync(tmpFile, inputString);

    // Spawn a new less process and pass the path to the temporary file as an argument
    const lessProcess = spawn('less', [tmpFile], {
      shell: true,
      stdio: ['inherit', 'inherit', process.stdout],
      stdout: ['inherit', 'inherit', process.stdin],
    });

    lessProcess.on('error', err => {
      console.error('err: ', err);
    });

    // When the less process exits, delete the temporary file
    lessProcess.on('exit', () => {
      unlinkSync(tmpFile);
    });
  }
}

new RIA();
