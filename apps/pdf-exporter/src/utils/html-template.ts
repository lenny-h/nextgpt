export const createPDFTemplate = ({
  title,
  content,
}: {
  title?: string;
  content: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${title ? `<title>${title}</title>` : ""}
      <style>
        @page {
          margin: 2cm;
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            font-size: 10pt;
            color: #666;
          }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        h2 {
          margin-top: 0.8em;
          margin-bottom: 0.4em;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        h3, h4, h5, h6 {
          margin-top: 0.6em;
          margin-bottom: 0.3em;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        p {
          margin-bottom: 1em;
        }
        code {
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        pre {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        blockquote {
          border-left: 3px solid #ccc;
          padding-left: 10px;
          margin-left: 0;
          color: #555;
        }
        img {
          max-width: 100%;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .math-inline, .math-display {
          font-family: "Times New Roman", serif;
        }
        .math-display {
          text-align: center;
          margin: 1em 0;
        }
        @media print {
          body {
            font-size: 12pt;
          }
          a {
            text-decoration: none;
            color: black;
          }
        }
      </style>
    </head>
    <body>
      ${title ? `<h1>${title}</h1>` : ""}
      ${content}
    </body>
    </html>
  `;
};
