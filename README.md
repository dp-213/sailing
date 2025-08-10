# Sailing Content-first

Dieses Repository trennt Inhalte von Darstellung. Sämtliche Texte und Daten liegen unter `/content`, das Frontend lädt sie zur Laufzeit.

## Arbeiten am Content
1. Branch `agent/<feature>` erstellen.
2. Dateien unter `/content` ändern.
3. `npm run validate` lokal ausführen.
4. Pull Request eröffnen – die Checks validieren Schema, Links und Bilder.
5. Nach Review und grünen Checks wird nach `main` gemergt und via GitHub Pages deployed.

## Struktur
- `/content` – Markdown/YAML/GeoJSON
- `/schemas` – JSON-Schemata
- `/automation` – Prompts und Playbooks für KI-Agenten
- `/config/settings.yaml` – Feature-Flags

## Entwicklungsbefehle
```bash
npm install
npm run validate
```
