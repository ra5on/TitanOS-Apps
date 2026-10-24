# Immich: aktuelle Kanäle und freie Dienstversionen

Die Immich-Vorlage verwendet jetzt den laufend aktuellen Kanal für Server und
Machine Learning (`release`) sowie `latest` für Valkey. Die Digest-Bindungen von
Valkey und PostgreSQL wurden entfernt. Das Image jedes Dienstes kann im
bestehenden TitanOS-Docker-App-Editor unabhängig auf einen gewünschten Tag
geändert werden; bei der Installation ist dies in der Compose-Ansicht möglich.

Immich veröffentlicht für Server, Machine Learning und sein PostgreSQL-Image
keinen `latest`-Tag. Deshalb verwendet die Vorlage den tatsächlich verfügbaren
`release`-Kanal für Server/ML und weiterhin den kompatiblen PostgreSQL-14-Tag
`14-vectorchord0.4.3-pgvectors0.2.0`. Ein Wechsel der PostgreSQL-Hauptversion
benötigt eine gesonderte Migration.

Bereits installierte Stacks werden durch die Katalogaktualisierung nicht
umgeschrieben. Gewünschte Tags unter **Docker › App bearbeiten** je Dienst
übernehmen und dabei vorhandene `@sha256:…`-Bindungen entfernen. Server und ML
aufeinander abstimmen; vor Versionswechseln Datenbank und Fotos gemeinsam sichern
und die Immich-Upgradehinweise lesen. Kein TitanOS-Systemupdate erforderlich.

## Prüfung

- Elf vorhandene Python-Katalogtests erfolgreich.
- Sämtliche 50 Compose-Vorlagen mit Docker Compose 5.6.1 validiert.
- Tatsächlichen TitanOS-Installationsgenerator und Dienst-Editor geprüft:
  vier Standard-Images, acht unabhängige Änderungen auf `latest` bzw. einen
  Test-Versionsnamen; andere Dienste, Datenpfade und Einstellungen bleiben erhalten.
- Gemeinsames generiertes Datenbankpasswort sowie unveröffentlichte Datenbank-
  und Valkey-Ports im erzeugten Stack geprüft.
- GHCR-Abfragen bestätigen `release` für Server/ML und den PostgreSQL-14-Tag;
  `latest` liefert bei allen drei Immich-Images HTTP 404.

Die Tests bestätigen Konfiguration und Bearbeitung. Sie umfassen keinen neuen
Container-Laufzeittest, keine Datenbankmigration und keinen echten Fotobestand.
Die Immich-Vorlage bleibt AGPL-3.0-only; dieses Katalog-Release ändert ihre Lizenz
nicht.
