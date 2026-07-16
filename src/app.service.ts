import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getLogs(): string {
    const markdown = readFileSync(
      join(process.cwd(), 'logs', 'api_reqs.md'),
      'utf-8',
    );

    const rows = markdown
      .trim()
      .split('\n')
      .map((line) =>
        line
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((cell) => cell.trim().replace(/`([^`]*)`/g, '<code>$1</code>')),
      );

    const [header, , ...body] = rows;

    const theadHtml = `<tr style="position: sticky;top: 0;">${header.map((cell) => `<th>${cell}</th>`).join('')}</tr>`;
    const tbodyHtml = body
      .map(
        (row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>API Request Logs</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
    th { background: #f4f4f4; }
    tr:nth-child(even) { background: #fafafa; }
    code { background: #eee; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <h2>API Request Logs</h2>
  <table>
    <thead>${theadHtml}</thead>
    <tbody>${tbodyHtml}</tbody>
  </table>
</body>
</html>`;
  }
}
