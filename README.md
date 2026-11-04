# Portfolio — Inconnu boy sensei

Site statique, sans framework ni dépendance JS : HTML, CSS et JavaScript écrits à la main.

## Fichiers
- `index.html` — structure + SEO (title, description, Open Graph, Twitter Card, JSON-LD Schema.org)
- `styles.css` — design system (tokens, grille 12 colonnes, dark/light, responsive, reduced-motion)
- `inconnuboy.js` — moteur d'animation maison : intro, split-text, reveals au scroll, marquee sensible à la vitesse de scroll, boutons magnétiques, curseur, compteurs
- Traduction : Google Translate traduit automatiquement le site dans la langue du navigateur du visiteur (après consentement aux cookies tiers). Aucune clé de langue stockée.
- `script.js` — thème, navigation, données GitHub en direct (SKYHOST épinglé en premier, dépôts de bots WhatsApp filtrés), consentement cookies
- `manifest.json`, `robots.txt`, `sitemap.xml` — SEO / PWA

## Liens
- GitHub : https://github.com/INCONNU-BOY-SENSEI
- YouTube : https://www.youtube.com/@inconnuboy-sensei
- TikTok : https://www.tiktok.com/@inconnuboytech
- Email : inconnuboytech@gmail.com

## Masquer des dépôts
Les dépôts dont le nom, la description ou les topics correspondent à `REPO_EXCLUDE` (en haut de `script.js`) ne sont pas affichés — par défaut : WhatsApp, Baileys, bots, `-md`, session/pairing.

## Déployer sur Vercel
1. Importer ce repo sur vercel.com → "Add New Project".
2. Framework Preset : **Other** (aucune commande de build).
3. Deploy.
