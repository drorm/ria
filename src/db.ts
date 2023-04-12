import {Client} from 'pg';

export class DB {
  client: any;

  constructor() {
    this.client = new Client({
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: 'localhost',
      port: 5432,
      database: process.env.PGDATABASE,
    });
    this.init();
  }

  async init() {
    await this.client.connect();
  }

  async runQuery(query: string) {
    // console.log({ query });

    try {
      const result = await this.client.query(query);
      // console.log(result.rows);
      return result.rows;
    } catch (err) {
      console.error(query);
      console.error(err);
      throw err; // propagate the error
    } finally {
      // Make sure to release the client before any error handling,
      // just in case the error handling itself throws an error.
      // client.release(); //TODO check that we get here on error
    }
  }

  /*
   * Show the list of tables in the db
   */
  async getTables() {
    const query =
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';";
    const res = await this.client.query(query);
    const tables = res.rows.map((row: any) => row.table_name);
    return tables;
  }

  /*
   * The shortSchema function generates an abbreviated description of the tables and columns in a PostgreSQL database.
   * It also includes foreign key constraints in the descriptions. The following is an eample of the output for the city table.
   * city (city_id, city, country_id, last_update constr (fkey (country_id) refer pagila(country_pkey))
   * The function returns a promise that resolves to an string containing the abbreviated descriptions.
   */

  async shortSchema() {
    const tableQuery = `
			SELECT c.table_name, c.column_name, c.data_type, fk.constraint_name, fk.unique_constraint_name, fk.unique_constraint_catalog, tc.table_name as target_table_name, ccu.column_name as target_column_name
			FROM information_schema.columns c
			LEFT JOIN information_schema.key_column_usage kcu
				ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
			LEFT JOIN information_schema.referential_constraints fk
				ON kcu.constraint_name = fk.constraint_name
			LEFT JOIN information_schema.table_constraints tc
				ON fk.unique_constraint_name = tc.constraint_name
			LEFT JOIN information_schema.key_column_usage kcu2
				ON tc.constraint_name = kcu2.constraint_name
			LEFT JOIN information_schema.columns ccu
				ON tc.table_name = ccu.table_name AND kcu2.column_name = ccu.column_name
			WHERE c.table_schema = 'public'
			ORDER BY c.table_name, c.ordinal_position;
		`;

    const res = await this.client.query(tableQuery);

    let currentTable = '';
    let currentDescription = '';
    let currentConstraints = '';
    const descriptions: string[] = [];

    for (let row of res.rows) {
      const tableName = row.table_name;
      const columnName = row.column_name;
      const dataType = row.data_type;
      const constraintName = row.constraint_name;
      const uniqueConstraintName = row.target_column_name;
      const uniqueConstraintTable = row.target_table_name;

      if (tableName !== currentTable) {
        if (currentTable !== '') {
          if (currentConstraints !== '') {
            currentDescription += ` ${currentConstraints}`;
          }
          descriptions.push(currentDescription);
        }
        currentTable = tableName;
        currentDescription = `${tableName} `;
        currentConstraints = '';
      } else {
        currentDescription += ',';
      }

      currentDescription += `${columnName}`;

      if (constraintName) {
        currentConstraints += ` ${columnName} refer ${uniqueConstraintTable}(${uniqueConstraintName})`;
      }
    }

    if (currentConstraints !== '') {
      currentDescription += ` ${currentConstraints}`;
    }
    descriptions.push(currentDescription);

    return descriptions.join('\n');
  }
}
