🦬 DOCUMENT DE CONCEPTION TECHNIQUE : STUDIO BISON (V3)
1. RÉSUMÉ EXÉCUTIF
Studio Bison est un IDE "Browser-Native" permettant de concevoir des applications web complètes sans infrastructure serveur. L'expérience utilisateur est calquée sur Notion (édition par blocs, slash-commands, arborescence infinie).

2. STACK TECHNIQUE
• Framework UI : Preact

• État Réactif : @preact/signals

• Stockage Local : Dexie.js (IndexedDB)

• Design : Tailwind CSS

• Logique Visuelle : LiteGraph.js

• Déploiement : Octokit.js (GitHub API)

3. ARCHITECTURE LOGICIELLE
3.1. Bison-Writer (UI Engine)

• Modèle : Arbre récursif de blocs (`UI_Tree`).

• UX : Slash Menu (`/`) pour insérer des blocs et Drag & Drop via poignées "6-dots". (NOTION LIKE)

• Navigation : Sidebar récursive pour la hiérarchie des pages.

3.2. Bison-DB (Data Engine)

• Schéma Builder : Interface visuelle pour définir tables et relations.

• Liaison : Blocs de type "Database View" connectés aux stores Dexie.js.

3.3. Bison-Flow (Logic Engine)

• Triggers : Événements de blocs (`onClick`, `onChange`).

• Graph Editor : Interface nodale pour mapper les événements aux actions.

4. DESIGN UI/UX
• Thème : "Bison Midnight" (Sombre, fond `#0F172A`).

• Interactions : Zéro bouton sauvegarder (Auto-save via Dexie), minimalisme absolu.
