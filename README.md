# Ria GPT natural language interface to Postgres

Ria, Relational Information Assistant, is a CLI that allows you to easily query a database using natural language. Simply enter your request in English , and RIA will translate your request into a SQL query, run the query, and return the results to you.

## Installation

- Clone this repo
- npm install
- npm run build
- Set up your credentials in the run.sh script. Make sure to set the password in the env and not the file.

## Running

```
./run.sh
```

## Features

- Accepts requests in English.
- Translates requests into SQL queries using advanced natural language processing techniques
- Runs queries against the database and returns the results
- Easy to use and intuitive interface

## Requirements

- A postgres database that RIA can connect to and query
- Access to a GPT type of engine:
  - An openAI account

## How to Use

1. The basic command is fetch as in:

- fetch 10 actors
- fetch

2. Press the "Submit" button to run your query
3. View the results of your query in the designated output area

## Examples

Here are a few examples of requests you can make to RIA with the [Pagila database](https://github.com/devrimgunduz/pagila):

- Show me all customers from New York
- List the names and email addresses of all customers who have placed an order in the past month
- How many orders were placed in the past year?

# How it works

The core of RIA is the shortSchema function. It creates an abreviated version of the db schema that GPT understands, while consuming less tokens. The rest, is just a standard prompt to ask GPT to convert the request to SQL.
