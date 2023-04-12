import {Configuration, OpenAIApi} from 'openai';
import * as fs from 'fs';
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export class GPT {
  openai = new OpenAIApi(configuration);
  constructor() {}

  async fetch(query: string) {
    try {
      // console.log(query);
      const completion = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{role: 'user', content: query}],
      });
      /*
      const completion = await this.openai.createCompletion({
        model: 'text-davinci-003',
        model: 'gpt-3.5-turbo',
        prompt: query,
        max_tokens: 1000,
      });
      */
      /*
       *  data: {
       * id: 'cmpl-6XKRMiJZifNtJuP29w34AXw7ZfkX5',
       * object: 'text_completion',
       * created: 1673401416,
       * model: 'text-davinci-003',
       * choices: [ [Object] ],
       * usage: { prompt_tokens: 254, completion_tokens: 23, total_tokens: 277 }
       * }
       */

      return completion.data;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }
}
