# Studio Bison V3 - Todo List Détaillée

## Résumé du projet

**Studio Bison V3** est un constructeur de sites visuels basé sur node.js utilisant Preact, TypeScript, Vite et Tailwind CSS v4. Le projet permet de créer des pages web avec un système de blocs similaire à Notion.

---

## Phase 1 : Infrastructure & Configuration ✅ TERMINÉE

### Fonctionnalités implémentées

| Fonctionnalité | Description |
|---------------|-------------|
| **Setup projet** | Configuration Preact + Vite + TypeScript |
| **Tailwind CSS v4** | Configuration avec @tailwindcss/vite et thème "Bison Midnight" |
| **Dexie.js** | Configuration IndexedDB pour le stockage local |
| **Types TypeScript** | Définition des types Block, Page, DatabaseSchema, Database |
| **Structure des dossiers** | components/, stores/, lib/, types/ |

### Fichiers créés

- `src/types/index.ts` - Types TypeScript
- `src/lib/db.ts` - Configuration et fonctions Dexie
- `src/stores/editor.ts` - Store Preact signals pour l'état global
- `src/index.css` - Styles globaux avec variables CSS

---

## Phase 2 : Bison-Writer (UI Engine) ✅ TERMINÉE

### Fonctionnalités implémentées

#### 2.1 Système de blocs

| Bloc | Description |
|------|-------------|
| **Text** | Bloc de texte standard avec textarea auto-resizable |
| **Heading 1/2/3** | Titres avec styles distincts |
| **Code** | Bloc de code avec sélecteur de langage (JS, TS, Python, HTML, CSS, JSON, Bash, SQL) |
| **Quote** | Citation avec bordure gauche violette |
| **Callout** | Boîte d'information avec fond/accent |
| **Divider** | Ligne horizontale de séparation |
| **Image** | Upload d'image via FileReader (DataURL) |
| **Database** | Placeholder pour futur bloc database |

#### 2.2 Slash Menu

| Fonctionnalité | Description |
|---------------|-------------|
| **Activation** | Taper "/" pour ouvrir le menu |
| **Filtrage** | Recherche dynamique (ex: "code" filtre vers "Code") |
| **Navigation clavier** | Flèches ↑↓ pour naviguer, Entrée pour sélectionner, Échap pour fermer |
| **Scroll auto** | L'élément sélectionné reste visible pendant la navigation |

#### 2.3 Navigation clavier

| Touche | Comportement |
|--------|-------------|
| **Entrée** | Crée un nouveau bloc vide et place le curseur dedans |
| **Ctrl+Entrée** | Nouvelle ligne à l'intérieur du bloc (comportement natif textarea) |
| **Backspace** | Sur bloc vide = supprime le bloc ; au début du texte = supprime le bloc précédent et garde le focus |
| **Suppr** | Supprime le texte sélectionné |
| **↑ (flèche haut)** | Si curseur au début → monte au bloc précédent |
| **↓ (flèche bas)** | Si curseur à la fin → descend au bloc suivant |
| **← (flèche gauche)** | Si curseur au début → bloc précédent |
| **→ (flèche droite)** | Si curseur à la fin → bloc suivant |

#### 2.4 Drag & Drop

| Fonctionnalité | Description |
|---------------|-------------|
| **Handle de drag** | 6 points visible à gauche de chaque bloc (semi-transparent, opaque au hover) |
| **Zones de drop** | Haut de la liste, entre chaque bloc (avant/après), bas de la liste |
| **Indicateurs visuels** | Ligne pointillée violette +背景 violet quand zone active |
| **Réorganisation** | Le bloc se repositionne à la zone de drop sélectionnée |

#### 2.5 Interactions supplémentaires

| Fonctionnalité | Description |
|---------------|-------------|
| **Menu contextuel** | Clic droit sur un bloc → "Delete block" ou "Add block below" |
| **Point d'insertion** | Cercle gris entre les blocs au hover pour insertion rapide |
| **Auto-save** | Sauvegarde automatique vers Dexie.js à chaque modification |

#### 2.6 Sidebar

| Fonctionnalité | Description |
|---------------|-------------|
| **Liste des pages** | Navigation entre les pages créées |
| **Créer une page** | Bouton "+ New Page" |
| **Supprimer une page** | Bouton de suppression au hover |
| **Affichage hiérarchique** | Pages triées par date de modification |

### Fichiers créés/modifiés

- `src/components/Block.tsx` - Composant bloc individuel
- `src/components/BlockTree.tsx` - Arbre de blocs avec zones de drop
- `src/components/Canvas.tsx` - Canevas principal avec gestion des événements
- `src/components/Sidebar.tsx` - Navigation des pages
- `src/lib/drag.ts` - État global du drag & drop
- `src/lib/focus.ts` - Gestion du focus entre blocs

---

## Phase 3 : Bison-DB (Data Engine) ✅ TERMINÉE

### Fonctionnalités implémentées

#### 3.1 Schema Builder ✅

| Fonctionnalité | Description |
|---------------|-------------|
| **Interface visuelle** | Création de tables via UI (nom, colonnes) |
| **Types de colonnes** | text, number, date, select, checkbox |
| **Options de colonnes** | Valeurs possibles pour les selects |
| **Modifier schema** | Ajout/suppression de colonnes via modale |
| **Supprimer table** | Suppression d'une table complète avec confirmation |

#### 3.2 Database View Block ✅

| Fonctionnalité | Description |
|---------------|-------------|
| **Sélection de table** | Choisir quelle table afficher via dropdown |
| **Affichage en grille** | Tableau avec les colonnes de la table |
| **Lecture seule** | Bloc en lecture seule dans l'éditeur |
| **Édition** | Via bouton "Modifier la table" → redirige vers Bison-DB |
| **Filtrage** | Afficher/masquer les colonnes |
| **Tri** | Ordonner par colonne (ASC/DESC) |

### Structure de données

```typescript
interface DatabaseSchema {
  id: string;
  name: string;
  columns: DatabaseColumn[];
  relations: DatabaseRelation[];
}

interface DatabaseColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'relation' | 'checkbox';
  options?: string[];  // Pour les types 'select'
}

interface DatabaseRelation {
  id: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: '1:1' | '1:N' | 'N:N';
}
```

---

## Phase 4 : Menu & Navigation ✅ TERMINÉE

### Fonctionnalités implémentées

| Feature | Description |
|--------|-------------|
| **Page Menu** | Éditeur de menu avec project name, homepage, items |
| **Sous-menus** | Support jusqu'à 10 items par sous-menu |
| **Boutons navigation** | Liens vers pages internes ou URLs externes |
| **Export HTML/CSS** | Génération complète du site statique |
| **Liens slugifiés** | Les URLs utilisent le titre de la page (ex: "Ma Page" → "ma-page.html") |
| **URLs externes auto** | Ajout automatique de https:// si absent |
| **Homepage twice** | La page d'accueil est exportée en index.html ET dans pages/ |
| **Chemin CSS** | Correct pour index et pages subfolders |
| **Dropdown hover** | CSS pour menus déroulants au survol |

### Fichiers créés/modifiés

- `src/components/MenuEditor.tsx` - Éditeur de menu
- `src/stores/settings.ts` - Store pour les paramètres du site
- `src/lib/export.ts` - Génération HTML/CSS/SQL

---

## Phase 5 : Thème & Polish ⏳ À FAIRE

### Fonctionnalités à implémenter

| # | Fonctionnalité | Priorité |
|---|----------------|----------|
| 1 | Responsive design | ✅ Important |
| 2 | Animations | ✅ Important |
| 3 | Refactor graphique complet | ✅ |
| 4 | Formatage du texte (Ctrl+B, Ctrl+I, Ctrl+U) | ✅ Important |
| 5 | Tableaux | ✅ Important |
| 6 | Listes (ordonnées/désordonnées) | ✅ Important |
| 7 | Copy/Cut/Paste | ✅ Important |

---

## Phase 6 : Suite (Long terme)

| # | Fonctionnalité |
|---|----------------|
| 1 | Base de données : vues multiples (Tableau, Kanban, Carte, Galerie) |
| 2 | Formulaire bloc : collecter données et envoyer vers API/DB |

---

## Tâches générales

### 1. General

- [x] Ajouter la page de menu principal
- [x] Ajouter sur toutes les pages le menu d'export (.json, .zip contenant tt le html css js sql et les assets)

### 2. BisonEditor

- [ ] Ajouter au clic droit les options de soulignment, de gras, de italique, et les raccourcis correspondants (Ctrl+B, Ctrl+I, Ctrl+U)
- [ ] Ajouter au clic droit les options de copier, de couper, de coller, de supprimer, de dupliquer
- [ ] Corriger légèrement l'affichage pour que les déplacements drag and drop aient des impacts visuels corrects.
- [ ] Ajouter la gestion des listes ordonnées et désordonnées dans le menu des slash commandes.
- [ ] Ajouter la gestion des tableaux dans le menu des slash commandes.
- [ ] Ajouter un système de Projet Blanc (template de base pour démarrer un nouveau projet)

### 3. BisonDB

- [ ] Plusieurs vues différentes pour les données (tableau, graphique, carte, kanban, feed, galerie, etc.)

---

## Dépendances installées

| Package | Usage |
|---------|-------|
| `preact` | Framework UI |
| `@preact/signals` | État réactif |
| `dexie` | Stockage IndexedDB |
| `tailwindcss` v4 | Design |
| `@tailwindcss/vite` | Plugin Vite pour Tailwind |
| `jszip` | Génération ZIP pour export |

---

## Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# TypeScript
tsc -b

# Preview production
npm run preview
```
