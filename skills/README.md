# Skills für den KI-Agenten

Dieser Ordner ist der Skill-Katalog des eingebauten KI-Agenten von TitanOS.
Ein Skill ist eine Anleitung, der der Agent Schritt für Schritt folgt, wenn
eine Aufgabe passt, zum Beispiel „Belege nach Steuerjahr sammeln“ oder
„Sicherungen prüfen“. TitanOS lädt die Skills zusammen mit den Apps (beim
Start und einmal am Tag). Die Person sieht sie im Agenten unter
**Skill-Katalog** und installiert sie dort einzeln.

Alle Skills hier schreibt TitanOS selbst (`author: ra5on`). Sie werden nicht
aus fremden Quellen übernommen.

## Format

Ein Ordner je Skill, darin eine Datei `skill.yaml`:

```text
skills/<id>/skill.yaml
```

`<id>` ist der Ordnername: Kleinbuchstaben, Ziffern und Bindestriche,
höchstens 64 Zeichen (`^[a-z0-9][a-z0-9-]{0,63}$`).

```yaml
name: Belege nach Steuerjahr sammeln      # höchstens 80 Zeichen
description: Ein Satz, was der Skill tut
author: ra5on
when: Wann der Agent den Skill nimmt („Belege für die Steuer 2025“)
tools: [ask_user, files_search, file_copy]
steps: |
  1. Mit files_search …
  2. Mit ask_user fragen (Ja / Nein / Abbrechen) …
```

- `when` und `steps` zusammen höchstens 4000 Bytes (Umlaute zählen doppelt).
- `tools` nennt nur echte Werkzeugnamen des Agenten. TitanOS liest außerdem
  jedes Wort mit Unterstrich in `steps` als Werkzeugnamen. Kennt ein Konto
  eines dieser Werkzeuge nicht, lässt sich der Skill dort nicht installieren.
  Darum in `steps` keine anderen Wörter mit Unterstrich verwenden, etwa
  Entitätsnamen oder Ordnernamen.
- Keine Passwörter, Schlüssel oder ähnliche Zugangsdaten, auch nicht als Wort
  in der Anleitung. Solche Skills lehnt TitanOS ab.
- Ein Skill, der nicht zum Format passt, wird übersprungen. Die anderen
  bleiben.

## Regeln für den Inhalt

- Deutsch, klar, Schritt für Schritt, und jedes Werkzeug beim Namen nennen.
- Erst nachsehen, dann vorschlagen, dann handeln.
- Alles, was löscht, verschiebt, überschreibt oder neu startet, vorher mit
  `ask_user` fragen. Nie still löschen und `files_delete` nie mit
  `permanent` aufrufen. Wo es geht, die umkehrbare Wahl zuerst anbieten
  (kopieren statt verschieben, „Aussortiert“-Ordner statt Papierkorb).
- Nie Erfolg melden, bevor das Ergebnis da ist.
- Keine Inhalte, Namen oder Pfade vom NAS ins Internet schicken.

## Einen neuen Skill beitragen

1. Einen Zweig anlegen und `skills/<id>/skill.yaml` nach dem Format oben
   schreiben.
2. Die Werkzeugnamen im Code von TitanOS prüfen
   (`backend/internal/api/catalog*.go`, `public_routes.go`, `agent*.go`).
3. Einen Pull Request gegen `main` öffnen und kurz beschreiben, wofür der
   Skill da ist. Nach der Durchsicht nimmt TitanOS ihn in den Katalog auf.
