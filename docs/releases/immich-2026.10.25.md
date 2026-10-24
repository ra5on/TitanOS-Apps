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

Keine Migration einer PostgreSQL-14-Datenbank, Foto-/Videoverarbeitung, echte
ML-Inferenz, GPU oder vorhandenen NAS-Daten getestet. Die abgeleitete Immich-
Vorlage bleibt AGPL-3.0-only; Images behalten die Rechte ihrer jeweiligen Projekte.
