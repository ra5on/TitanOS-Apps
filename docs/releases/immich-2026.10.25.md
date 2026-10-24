# Immich: kompletter Stack mit aktuellen Kanälen

Auch PostgreSQL folgt jetzt einem laufend aktualisierten Kanal. Die Immich-
Vorlage verwendet keine feste Patch-Version und keine Digest-Bindung mehr:

| Dienst | Image/Kanal |
| --- | --- |
| Immich Server | `ghcr.io/immich-app/immich-server:release` |
| Immich Machine Learning | `ghcr.io/immich-app/immich-machine-learning:release` |
| Valkey | `docker.io/valkey/valkey:latest` |
| PostgreSQL mit VectorChord | `ghcr.io/tensorchord/vchord-suite:pg18-latest` |

Immich bietet Server und ML unter dem Kanalnamen `release` an. Das bisherige
Immich-PostgreSQL-Image bietet keinen `latest`-Kanal; deshalb verwendet die Vorlage
jetzt das PostgreSQL-18-Image des
[VectorChord-Herstellers](https://github.com/tensorchord/VectorChord-images). `pg18-latest` aktualisiert
PostgreSQL-Patches und Erweiterungen innerhalb der PostgreSQL-Hauptversion 18.

Der Datenbankpfad wird passend zu PostgreSQL 18 unter `/var/lib/postgresql`
eingebunden. Ein expliziter TCP-Healthcheck ersetzt die zuvor vom Immich-Image
geerbte Prüfung. Datenbank und Valkey bleiben ohne veröffentlichten Host-Port.

## Bestehende Installationen

Die Katalogvorlage gilt für neue Installationen. Sie verändert vorhandene Stacks
und Daten nicht. Eine vorhandene PostgreSQL-14-Datenbank muss vor dem Wechsel
exportiert und in einen neuen PostgreSQL-18-Datenordner importiert werden.
Das alte Datenverzeichnis darf nicht einfach mit dem neuen Image geöffnet werden.
Fotos und Datenbank vorher konsistent sichern. Keine automatische Migration und
kein TitanOS-Systemupdate erforderlich.

## Prüfung und Grenzen

- Elf vorhandene Python-Katalogtests und alle 50 Compose-Vorlagen lokal geprüft.
- Tatsächlicher TitanOS-Installationsgenerator/Dienst-Editor: vier Standard-Images,
  acht unabhängige Image-Änderungen, verknüpftes Datenbankpasswort und PostgreSQL-
  Volume-Zuordnung geprüft.
- [Isolierter GitHub-Starttest](https://github.com/ra5on/TitanOS-Apps/actions/runs/40136551966)
  für den tatsächlichen Vier-Dienste-Stack erfolgreich:
  Healthchecks, PostgreSQL 18, aktive Erweiterungen `vector`/`vchord`, Anmeldung,
  Zugriffsschutz und erhaltenes Album nach Neuerstellung sämtlicher Container.

Der erfolgreiche Stacktest lief mit PostgreSQL 18.3. Die erneute Prüfung auf dem
Hauptbranch scheiterte anschließend bereits beim Image-Download am Registry-
Rate-Limit (`toomanyrequests`), auch mit Anmeldung und begrenzten Wiederholungen:
[Wiederholungslauf](https://github.com/ra5on/TitanOS-Apps/actions/runs/40137022377).
Die App-Konfiguration entspricht weiterhin dem erfolgreich gestarteten Stack;
die späteren Codeänderungen betreffen nur Anmeldung und Downloadbehandlung der CI.
Dieser erneute Lauf wird ausdrücklich nicht als bestandener Laufzeittest gewertet.

Keine Migration einer PostgreSQL-14-Datenbank, Foto-/Videoverarbeitung, echte
ML-Inferenz, GPU oder vorhandenen NAS-Daten getestet. Die abgeleitete Immich-
Vorlage bleibt AGPL-3.0-only; Images behalten die Rechte ihrer jeweiligen Projekte.

## Erfolgreiche Wiederholungsprüfung am 25. Oktober 2026

Der [erneute Lauf des veröffentlichten Stacks](https://github.com/ra5on/TitanOS-Apps/actions/runs/40137745580)
ist erfolgreich. Zusätzlich bestätigt der
[erweiterte Funktionstest](https://github.com/ra5on/TitanOS-Apps/actions/runs/40137905257)
Immich Server und ML 3.3.5, Valkey 9.1.2 sowie PostgreSQL 18.3 mit VectorChord
1.1.1 und pgvector 0.8.2. Alle vier Dienste waren gesund. Ein synthetisches PNG
wurde hochgeladen, bytegenau heruntergeladen, als Vorschaubild verarbeitet und
über echte CPU-ML-Inferenz und Vektorsuche gefunden. Nach Neuerstellung aller
Container waren Konto, Album, Originalbild und Suchergebnis erhalten; die geprüften
Warteschlangen hatten keine fehlgeschlagenen Aufträge. Exakte Images und Prüfgrenzen
stehen im [maschinenlesbaren Prüfbericht](../validation/immich-2026-10-25.json).
Migrationen alter Datenbanken, Video-Transcoding, Gesichtserkennungsqualität und
GPU-Beschleunigung bleiben ungeprüft.
