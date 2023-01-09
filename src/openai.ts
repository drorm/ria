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
      const completion = await this.openai.createCompletion({
        model: 'text-davinci-003',
        prompt: query,
        max_tokens: 1000,
      });
      return(completion.data.choices[0].text);
    } catch (error: any) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }
}
