# Studio Bison

Un constructeur de sites web visuel et no-code fonctionnant directement dans le navigateur.

## Fonctionnalités

### Éditeur Visuel
- Interface par blocs façon Notion
- Menu slash (`/`) pour insérer des blocs
- Glisser-déposer via poignées "6-dots"
- Sidebar récursive pour la hiérarchie des pages
- Thème sombre "Bison Midnight"

### Base de données
- Constructeur de schéma visuel
- Tables et relations entre données
- Blocs "Database View" connectés au stockage local

### Logique No-Code
- Éditeur nodale LiteGraph.js
- Triggers sur les événements (`onClick`, `onChange`)
- Mapper les événements aux actions

### Export & Publication
- Export HTML local (ZIP)
- Export JSON pour sauvegarde
- Publication automatique vers GitHub + Vercel
- Déploiement en un clic

## Stack Technique

- **Framework UI**: Preact
- **État réactif**: @preact/signals
- **Stockage**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS
- **Logique visuelle**: LiteGraph.js
- **Éditeur nodal**: ReactFlow

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build Production

```bash
npm run build
```

## Aperçu

Studio Bison permet de créer des sites web complets sans écrire de code. Il combine:
- La simplicité d'édition de Notion
- La puissance d'une base de données visuelle
- Un éditeur logique nodale pour les interactions
- Le déploiement automatique vers Vercel

## License

MIT
