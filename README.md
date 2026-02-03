# Walentynki 💘 (one-page, Vite, GitHub Pages)

## Jak uruchomić lokalnie
```bash
npm install
npm run dev
```

## Jak dodać zdjęcia
Wrzucaj zdjęcia do:
- `src/assets/photos/` (jpg/png/webp/gif)

> Po dodaniu zdjęć czasem trzeba zrestartować `npm run dev`, żeby Vite odświeżył glob.

## Jak dodać dźwięk
Wrzuc plik mp3 tutaj:
- `public/sounds/holy-moly.mp3`

## Build (pod GitHub Pages)
```bash
npm run build
```
Wynik jest w folderze `dist/`.

### Najprostszy deploy na GitHub Pages
1. W repo na GitHub: Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` i folder: `/docs` **albo** użyj `dist/` przez Actions

**Opcja A (bez GitHub Actions):**  
- Zmień w `vite.config.js` `base: "./"` (już ustawione)
- Zbuduj `npm run build`
- Skopiuj zawartość `dist/` do folderu `docs/` i wypchnij do `main`  
  (w Pages wybierz `/docs`)

**Opcja B (GitHub Actions):**
- Użyj standardowego workflow Vite → Pages (build z `dist/`)

Powodzenia! 💞
