export function generateCSS(): string {
  return `/* Studio Bison Generated Styles */
/* Single CSS file for all pages */

:root {
  --bg: #ffffff;
  --text: #1a1a2e;
  --text-light: #6b7280;
  --accent: #6366f1;
  --accent-light: #818cf8;
  --border: #e5e7eb;
  --code-bg: #f3f4f6;
  --callout-bg: #fef3c7;
  --callout-border: #f59e0b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a2e;
    --text: #f3f4f6;
    --text-light: #9ca3af;
    --accent: #818cf8;
    --accent-light: #6366f1;
    --border: #374151;
    --code-bg: #111827;
    --callout-bg: #422006;
    --callout-border: #d97706;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  background-color: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav-links a {
  color: var(--text-light);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--accent);
}

/* Dropdown Menu */
.nav-links li {
  position: relative;
}

.nav-links li.has-dropdown > a::after {
  content: ' ▼';
  font-size: 0.6rem;
  margin-left: 0.25rem;
}

.nav-links .dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0.5rem 0;
  z-index: 50;
}

.nav-links li.has-dropdown:hover > .dropdown {
  display: block;
}

.nav-links .dropdown li {
  display: block;
}

.nav-links .dropdown a {
  display: block;
  padding: 0.5rem 1rem;
  color: var(--text-light);
  font-size: 0.875rem;
}

.nav-links .dropdown a:hover {
  background-color: var(--code-bg);
  color: var(--accent);
}

/* Button */
.button-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent);
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.button-link:hover {
  opacity: 0.9;
}

.button-disabled {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--text-light);
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  opacity: 0.5;
}

/* Main Content */
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
  flex: 1;
  width: 100%;
}

/* Typography */
h1.heading-1,
h2.heading-2,
h3.heading-3 {
  color: var(--text);
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 1rem;
}

.heading-1 {
  font-size: 2.5rem;
  margin-top: 2rem;
}

.heading-2 {
  font-size: 1.875rem;
  margin-top: 1.75rem;
}

.heading-3 {
  font-size: 1.5rem;
  margin-top: 1.5rem;
}

p.text {
  margin-bottom: 1rem;
  color: var(--text);
}

/* Quote */
blockquote.quote {
  border-left: 4px solid var(--accent);
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--text-light);
}

/* Code */
pre.code {
  background-color: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.5rem 0;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--text);
}

/* Callout */
.callout {
  background-color: var(--callout-bg);
  border: 1px solid var(--callout-border);
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
}

/* Divider */
hr.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2rem 0;
}

/* Image */
figure.image {
  margin: 2rem 0;
}

figure.image img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

/* Database Table */
.database {
  margin: 2rem 0;
  overflow-x: auto;
}

.database-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.database-table th,
.database-table td {
  border: 1px solid var(--border);
  padding: 0.75rem;
  text-align: left;
}

.database-table th {
  background-color: var(--code-bg);
  font-weight: 600;
}

.database-table tr:hover {
  background-color: var(--code-bg);
}

.database-empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-light);
}

/* Footer */
.footer {
  background-color: var(--bg);
  border-top: 1px solid var(--border);
  padding: 2rem 0;
  text-align: center;
}

.footer p {
  color: var(--text-light);
  font-size: 0.875rem;
}

.footer a {
  color: var(--accent);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 2rem 1rem;
  }
  
  .heading-1 {
    font-size: 2rem;
  }
  
  .heading-2 {
    font-size: 1.5rem;
  }
  
  .heading-3 {
    font-size: 1.25rem;
  }
  
  .nav-container {
    padding: 0 1rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
}
`;
}
