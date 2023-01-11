import Table from 'cli-table';

export async function displayQueryResult(rows: any[]) {
  // console.log(rows);

  // Get the keys for the table head from the first element in the rows array
  const head = Object.keys(rows[0]);

  // Create a new table with dynamic head
  const table = new Table({
    head,
    colWidths: Array(head.length).fill(20),
  });

  // Add rows to the table
  rows.forEach(row => {
    const values = head.map(key => row[key] || '');
    table.push(values);
  });
  // console.log('table', table);

  // Output the table to the terminal
  return table.toString();
}
