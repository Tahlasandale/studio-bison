import type { Page, Block, DatabaseSchema, Database, MenuItem, SiteSettings } from '../types';
import { generateCSS } from './cssGenerator';
import JSZip from 'jszip';

export function generatePageHTML(
  page: Page,
  pages: Page[],
  isInPagesFolder: boolean,
  schemas: DatabaseSchema[],
  dbDataMap: Map<string, Database>,
  projectName: string,
  menuItems: MenuItem[]
): string {
  const blocksHTML = page.blocks.map(block => blockToHTML(block, schemas, dbDataMap, pages, isInPagesFolder)).join('\n');
  const navLinks = generateNavLinks(pages, menuItems, isInPagesFolder);
  
  const cssPath = isInPagesFolder ? '../styles.css' : 'styles.css';
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(page.title || 'Page')}</title>
  <link rel="stylesheet" href="${cssPath}">
</head>
<body>
  ${generateNavbarHTML(navLinks, projectName, isInPagesFolder)}
  <main class="container">
    ${blocksHTML}
  </main>
  ${generateFooterHTML()}
</body>
</html>`;
}

function generateNavLinks(pages: Page[], menuItems: MenuItem[], isInPagesFolder: boolean): string {
  const pageMap = new Map(pages.map(p => [p.id, p]));
  
  const renderMenuItem = (item: MenuItem, _isSubmenu: boolean = false): string => {
    let href = '#';
    if (item.type === 'page' && item.pageId) {
      const page = pageMap.get(item.pageId);
      if (page) {
        href = isInPagesFolder ? `${slugify(page.title || 'page')}.html` : `pages/${slugify(page.title || 'page')}.html`;
      }
    } else if (item.type === 'external' && item.url) {
      let finalUrl = item.url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      href = finalUrl;
    }
    
    let html = `        <li><a href="${href}">${escapeHTML(item.label)}</a></li>`;
    
    if (item.children && item.children.length > 0) {
      html = `        <li class="has-dropdown">
          <a href="${href}">${escapeHTML(item.label)}</a>
          <ul class="dropdown">
${item.children.map(child => renderMenuItem(child, true)).join('\n')}
          </ul>
        </li>`;
    }
    
    return html;
  };
  
  return menuItems.map(item => renderMenuItem(item)).join('\n');
}

function generateNavbarHTML(navLinks: string, projectName: string, isInPagesFolder: boolean): string {
  const logoHref = isInPagesFolder ? '../index.html' : 'index.html';
  return `  <nav class="navbar">
    <div class="nav-container">
      <a href="${logoHref}" class="logo">${escapeHTML(projectName)}</a>
      <ul class="nav-links">
${navLinks}
      </ul>
    </div>
  </nav>`;
}

function generateFooterHTML(): string {
  return `  <footer class="footer">
    <p>Generated with <a href="https://studiobison.dev" target="_blank">Studio Bison</a></p>
  </footer>`;
}

function blockToHTML(block: Block, schemas: DatabaseSchema[], dbDataMap: Map<string, Database>, pages: Page[], isInPagesFolder: boolean = false): string {
  const content = escapeHTML(block.content || '');
  
  switch (block.type) {
    case 'heading1':
      return `    <h1 class="heading-1">${content}</h1>`;
    case 'heading2':
      return `    <h2 class="heading-2">${content}</h2>`;
    case 'heading3':
      return `    <h3 class="heading-3">${content}</h3>`;
    case 'text':
      const paragraphs = content.split('\n').filter(p => p.trim());
      return paragraphs.map(p => `    <p class="text">${p}</p>`).join('\n');
    case 'quote':
      return `    <blockquote class="quote">${content}</blockquote>`;
    case 'code':
      const lang = (block.properties?.language as string) || 'plaintext';
      return `    <pre class="code"><code class="language-${lang}">${content}</code></pre>`;
    case 'callout':
      return `    <div class="callout">${content}</div>`;
    case 'divider':
      return `    <hr class="divider">`;
    case 'image':
      if (block.content) {
        return `    <figure class="image">
      <img src="${block.content}" alt="">
    </figure>`;
      }
      return '';
    case 'database': {
      const schemaId = block.properties?.schemaId as string;
      const db = schemaId ? dbDataMap.get(schemaId) : null;
      const schema = schemaId ? schemas.find(s => s.id === schemaId) : null;
      if (!db || !schema) return '';
      return generateDatabaseTableHTML(db, schema, block.properties);
    }
    case 'button': {
      const linkType = block.properties?.linkType as string || 'none';
      const pageId = block.properties?.pageId as string || '';
      const url = block.properties?.url as string || '';
      const buttonText = block.content || 'Cliquez ici';
      
      if (linkType === 'page' && pageId) {
        const targetPage = pages.find(p => p.id === pageId);
        const pageSlug = targetPage ? slugify(targetPage.title || 'page') : 'page';
        const href = isInPagesFolder ? `${pageSlug}.html` : `pages/${pageSlug}.html`;
        return `    <a href="${href}" class="button-link">${escapeHTML(buttonText)}</a>`;
      }
      if (linkType === 'external' && url) {
        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl;
        }
        return `    <a href="${escapeHTML(finalUrl)}" class="button-link" target="_blank" rel="noopener noreferrer">${escapeHTML(buttonText)}</a>`;
      }
      return `    <span class="button-disabled">${escapeHTML(buttonText)}</span>`;
    }
    default:
      return `    <p class="text">${content}</p>`;
  }
}

function generateDatabaseTableHTML(database: Database, schema: DatabaseSchema, properties?: Record<string, unknown>): string {
  let data = database.data;
  
  if (!data || data.length === 0) {
    return `    <div class="database-empty">
      <p>Aucune donnée</p>
    </div>`;
  }
  
  const hiddenColumns = (properties?.hiddenColumns as string[]) || [];
  const sortColumnId = properties?.sortColumn as string | undefined;
  const sortDirection = (properties?.sortDirection as 'asc' | 'desc') || 'asc';
  
  const visibleColumns = schema.columns.filter(col => !hiddenColumns.includes(col.id));
  if (visibleColumns.length === 0) return '';
  
  if (sortColumnId && visibleColumns.find(col => col.id === sortColumnId)) {
    const column = schema.columns.find(col => col.id === sortColumnId);
    if (column) {
      data = [...data].sort((a, b) => {
        const valA = a[sortColumnId];
        const valB = b[sortColumnId];
        let comparison = 0;
        
        if (column.type === 'checkbox') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else if (column.type === 'number') {
          comparison = (Number(valA) || 0) - (Number(valB) || 0);
        } else if (column.type === 'date') {
          comparison = (Number(valA) || 0) - (Number(valB) || 0);
        } else {
          comparison = String(valA ?? '').localeCompare(String(valB ?? ''));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
  }
  
  const formatCellValue = (column: DatabaseSchema['columns'][0], value: unknown): string => {
    if (value === null || value === undefined) return '-';
    
    if (column.type === 'checkbox') {
      return value ? '✓' : '-';
    }
    
    if (column.type === 'date' && typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    
    if (column.type === 'select' && column.options) {
      return String(value);
    }
    
    return String(value);
  };
  
  const headers = visibleColumns.map(col => `        <th>${escapeHTML(col.name)}</th>`).join('\n');
  const rows = data.map(row => {
    const cells = visibleColumns.map(col => {
      const value = row[col.id];
      const formattedValue = formatCellValue(col, value);
      return `        <td>${escapeHTML(formattedValue)}</td>`;
    }).join('\n');
    return `      <tr>\n${cells}\n      </tr>`;
  }).join('\n');
  
  return `    <div class="database">
    <table class="database-table">
      <thead>
        <tr>
${headers}
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateSQLExport(schemas: DatabaseSchema[], databases: Database[]): string {
  let sql = `-- Generated by Studio Bison\n`;
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  for (const schema of schemas) {
    const db = databases.find(d => d.schemaId === schema.id);
    
    sql += `-- Table: ${schema.name}\n`;
    sql += `DROP TABLE IF EXISTS ${schema.name};\n\n`;
    
    const columns: string[] = ['id TEXT PRIMARY KEY'];
    for (const col of schema.columns) {
      switch (col.type) {
        case 'number':
          columns.push(`${col.name} INTEGER`);
          break;
        case 'date':
          columns.push(`${col.name} INTEGER`);
          break;
        case 'checkbox':
          columns.push(`${col.name} INTEGER`);
          break;
        default:
          columns.push(`${col.name} TEXT`);
      }
    }
    columns.push('created_at INTEGER');
    columns.push('updated_at INTEGER');
    
    sql += `CREATE TABLE ${schema.name} (\n  ${columns.join(',\n  ')}\n);\n\n`;
    
    if (db && db.data && db.data.length > 0) {
      for (const row of db.data) {
        const values: string[] = [`'${row.id || crypto.randomUUID()}'`];
        for (const col of schema.columns) {
          const val = row[col.id];
          if (val === null || val === undefined) {
            values.push('NULL');
          } else if (typeof val === 'boolean') {
            values.push(val ? '1' : '0');
          } else if (typeof val === 'number') {
            values.push(String(val));
          } else {
            values.push(`'${String(val).replace(/'/g, "''")}'`);
          }
        }
        values.push(String(Date.now()));
        values.push(String(Date.now()));
        
        sql += `INSERT INTO ${schema.name} VALUES (${values.join(', ')});\n`;
      }
      sql += '\n';
    }
  }
  
  return sql;
}

export interface ImageAsset {
  filename: string;
  data: string;
  mimeType: string;
}

export function extractImagesFromPages(pages: Page[]): ImageAsset[] {
  const images: ImageAsset[] = [];
  const seen = new Set<string>();
  
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.type === 'image' && block.content) {
        if (!seen.has(block.content)) {
          seen.add(block.content);
          const asset = dataURLToImageAsset(block.content);
          if (asset) {
            images.push(asset);
          }
        }
      }
    }
  }
  
  return images;
}

function dataURLToImageAsset(dataURL: string): ImageAsset | null {
  const match = dataURL.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  
  const mimeType = match[1];
  const base64 = match[2];
  
  const extension = getExtensionFromMimeType(mimeType);
  const filename = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;
  
  return {
    filename,
    data: base64,
    mimeType
  };
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return map[mimeType] || '.png';
}

export interface ExportResult {
  htmlFiles: { path: string; content: string }[];
  cssContent: string;
  sqlContent: string;
  jsContent: string;
  images: ImageAsset[];
}

export async function generateFullExport(
  pages: Page[],
  schemas: DatabaseSchema[],
  databases: Database[],
  settings: SiteSettings = { projectName: 'Mon Site', defaultPageId: null, menuItems: [] }
): Promise<ExportResult> {
  const dbDataMap = new Map<string, Database>();
  for (const db of databases) {
    dbDataMap.set(db.schemaId, db);
  }

  const images = extractImagesFromPages(pages);
  
  const htmlFiles: { path: string; content: string }[] = [];
  
  const defaultPageId = settings.defaultPageId;
  const pageOrder = [...pages];
  if (defaultPageId) {
    const defaultPageIndex = pages.findIndex(p => p.id === defaultPageId);
    if (defaultPageIndex > 0) {
      const [defaultPage] = pageOrder.splice(defaultPageIndex, 1);
      pageOrder.unshift(defaultPage);
    }
  }
  
  for (let i = 0; i < pageOrder.length; i++) {
    const page = pageOrder[i];
    const isHomepage = i === 0;
    
    // First render: as index.html at root (or as regular page)
    const path = isHomepage ? 'index.html' : `pages/${slugify(page.title || `page-${i + 1}`)}.html`;
    const content = generatePageHTML(page, pages, i > 0, schemas, dbDataMap, settings.projectName, settings.menuItems);
    htmlFiles.push({ path, content });
    
    // Second render: homepage also in pages folder with correct CSS path
    if (isHomepage && settings.defaultPageId) {
      const homepagePath = `pages/${slugify(page.title || 'page')}.html`;
      const homepageContent = generatePageHTML(page, pages, true, schemas, dbDataMap, settings.projectName, settings.menuItems);
      htmlFiles.push({ path: homepagePath, content: homepageContent });
    }
  }

  const cssContent = generateCSS();
  const sqlContent = generateSQLExport(schemas, databases);

  return {
    htmlFiles,
    cssContent,
    sqlContent,
    jsContent: '',
    images
  };
}

export async function downloadZIP(result: ExportResult, projectName?: string): Promise<void> {
  const zip = new JSZip();
  
  zip.file('styles.css', result.cssContent);
  
  if (result.sqlContent) {
    zip.file('database.sql', result.sqlContent);
  }
  
  if (result.jsContent) {
    zip.file('app.js', result.jsContent);
  }
  
  const pagesFolder = zip.folder('pages');
  for (const file of result.htmlFiles) {
    if (file.path === 'index.html') {
      zip.file('index.html', file.content);
    } else if (pagesFolder && file.path.startsWith('pages/')) {
      const fileName = file.path.replace(/^pages\//, '');
      pagesFolder.file(fileName, file.content);
    }
  }
  
  const assetsFolder = zip.folder('assets');
  if (assetsFolder && result.images.length > 0) {
    for (const image of result.images) {
      const binary = atob(image.data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      assetsFolder.file(image.filename, array);
    }
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = projectName ? `${projectName}.zip` : 'studio-bison-export.zip';
  a.click();
  URL.revokeObjectURL(url);
}
