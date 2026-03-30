# Raccourcis Clavier - Studio Bison V3

## Éditeur de Blocs

| Raccourci | Action | Description |
|-----------|--------|-------------|
| `Ctrl+Z` | Undo | Annuler la dernière modification |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo | Rétablir la dernière action annulée |
| `Ctrl+Entrée` | Nouvelle ligne | Insère un saut de ligne dans le bloc actuel |
| `Ctrl+A` | Tout sélectionner | Sélectionne tout le texte du bloc |
| `Delete` (avec sélection) | Effacer tout | Efface tout le contenu du bloc |
| `Backspace` (avec sélection) | Effacer tout | Efface tout le contenu du bloc |
| `Tab` | Focus bloc suivant | Déplace le focus au bloc suivant |
| `Shift+Tab` | Focus bloc précédent | Déplace le focus au bloc précédent |
| `Entrée` | Nouveau bloc | Crée un nouveau bloc de texte en dessous |
| `ArrowUp` (curseur début) | Focus bloc précédent | Déplace le focus au bloc supérieur |
| `ArrowDown` (curseur fin) | Focus bloc suivant | Déplace le focus au bloc inférieur |
| `ArrowLeft` (curseur début) | Focus bloc précédent | Déplace le focus au bloc supérieur |
| `ArrowRight` (curseur fin) | Focus bloc suivant | Déplace le focus au bloc suivant |
| `Backspace` (bloc vide) | Supprimer | Supprime le bloc actuel |
| `Backspace` (curseur début) | Fusion | Supprime le bloc précédent et fusionne le contenu |
| `Ctrl+C` | Copier | Copie le texte sélectionné (natif) |
| `Ctrl+V` | Coller | Colle le texte du presse-papiers (natif) |
| `Ctrl+X` | Couper | Coupe le texte sélectionné (natif) |

## Menu Slash

Le menu slash s'ouvre en tapant `/` au début d'un bloc.

| Raccourci | Action |
|-----------|--------|
| `ArrowUp` | Sélection précédente |
| `ArrowDown` | Sélection suivante |
| `Entrée` | Valider la sélection |
| `Escape` | Fermer le menu |

## Implémentation

- Hook centralisé: `src/lib/useKeyboardNavigation.ts`
- Store d'historique: `src/stores/history.ts` (limite: 50 actions)
- Focus après slash menu: `src/components/Block.tsx` (useEffect)
- Fusion de blocs: `src/components/Canvas.tsx` (handleMergeWithPrevious)
