/**
 * Script to generate PDF versions of all markdown documentation
 * Requires: npm install markdown-pdf
 */

const markdownpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the pdf directory exists
const PDF_DIR = path.join(__dirname, '..', 'docs', 'pdf');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Get all markdown files
const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// Custom PDF styling
const pdfOptions = {
  cssPath: path.join(__dirname, '..', 'styles', 'pdf.css'),
  paperBorder: '1cm',
  paperFormat: 'A4',
  remarkable: {
    html: true,
    breaks: true,
    typographer: true,
  },
  preProcessHtml: function(html) {
    return html
      .replace(/Version: (\d+\.\d+\.\d+)/g, '<div class="version">Version: $1</div>')
      .replace(/<h1>(.*?)<\/h1>/g, '<div class="title"><h1>$1</h1><div class="logo"></div></div>');
  }
};

// Create a simple CSS file for styling PDFs if it doesn't exist
const PDF_CSS_DIR = path.join(ROOT_DIR, 'styles');
const PDF_CSS_PATH = path.join(PDF_CSS_DIR, 'pdf.css');

if (!fs.existsSync(PDF_CSS_DIR)) {
  fs.mkdirSync(PDF_CSS_DIR, { recursive: true });
}

if (!fs.existsSync(PDF_CSS_PATH)) {
  fs.writeFileSync(PDF_CSS_PATH, `
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      font-size: 12pt;
      color: #333;
    }
    
    .title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2em;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1em;
    }
    
    .logo {
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RERCMUIwQTM4NkNFMTFFM0FBNTJFRTMzNTJEMUJDNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RERCMUIwQTQ4NkNFMTFFM0FBNTJFRTMzNTJEMUJDNDYiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpEREIxQjBBMTg2Q0UxMUUzQUE1MkVFMzM1MkQxQkM0NiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEREIxQjBBMjg2Q0UxMUUzQUE1MkVFMzM1MkQxQkM0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pp/mixwAABMrSURBVHjaNNrnrptV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);
      width: 100px;
      height: 50px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }
    
    .version {
      font-size: 0.9em;
      color: #777;
      margin-bottom: 1em;
    }
    
    h1 {
      color: #0072AA;
      margin-top: 0;
    }
    
    h2 {
      color: #404040;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.3em;
    }
    
    h3 {
      color: #505050;
    }
    
    h4 {
      color: #606060;
    }
    
    code {
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      font-size: 0.9em;
    }
    
    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 3px;
      overflow-x: auto;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
    }
    
    a {
      color: #0072AA;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    ul, ol {
      padding-left: 2em;
    }
    
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      color: #666;
      margin-left: 0;
    }
    
    img {
      max-width: 100%;
    }
    
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2em 0;
    }
    
    @media print {
      body {
        font-size: 10pt;
      }
      
      a {
        color: #000;
      }
    }
  `);
}

// Process files in the root directory
function processMarkdownFiles(directory) {
  console.log(`Processing Markdown files in ${directory}...`);
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const inputPath = path.join(directory, file);
      const outputPath = path.join(PDF_DIR, `${path.basename(file, '.md')}.pdf`);
      
      console.log(`Converting ${inputPath} to PDF...`);
      
      markdownpdf(pdfOptions)
        .from(inputPath)
        .to(outputPath, () => {
          console.log(`Created ${outputPath}`);
        });
    }
  });
}

// Start processing
console.log('Starting PDF generation...');
processMarkdownFiles(ROOT_DIR);
processMarkdownFiles(DOCS_DIR);

console.log('PDF generation complete. Files available in docs/pdf/ directory.');