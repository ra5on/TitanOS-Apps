# Alle Apps: aktuelle Standardkanäle und eigene Image-Tag-Variablen

Alle **50 Apps mit 66 Diensten** sind auf laufend aktualisierte Image-Kanäle
umgestellt. Jeder Container besitzt eine eigene Compose-Variable für den Tag,
mit einer expliziten Vorgabe direkt in `image:`. Jede App enthält eine
`.env.example` mit sämtlichen Tag-Variablen. Die Craft-Katalogautomatik erhält
diese Variablen und Beispiele auch bei späteren Aktualisierungen.

62 Dienste verwenden standardmäßig `latest`. Frigate nennt seinen aktuellen
Kanal `stable`, Immich Server/ML `release` und PostgreSQL/VectorChord
`pg18-latest`; diese vier Images veröffentlichen keinen `latest`-Tag.

Beispiel:

```yaml
image: ghcr.io/immich-app/immich-server:${IMMICH_IMMICH_SERVER_IMAGE_TAG:-release}
```

`IMMICH_IMMICH_SERVER_IMAGE_TAG=v3.3.5` in der Compose-Umgebung wählt die konkrete
Version. Ohne gesetzte Variable gilt der Wert hinter `:-`. Jeder Container kann
unabhängig gewählt werden; zusammengehörige Dienste kompatibel halten. Alternativ
lässt sich die Vorgabe im vorhandenen Image-Feld bzw. in der Compose-Ansicht
ändern. Es gibt **keine Änderung an TitanOS**.

Die [Tabelle aller Image-Variablen](https://github.com/ra5on/TitanOS-Apps/blob/catalog-2026.10.25/docs/IMAGE-TAGS.md) und die `.env.example` jeder
App beschreiben die Auswahl. Eine bestehende `.env` ergänzen und generierte
Datenbankpasswörter beibehalten; nicht mit der Beispieldatei überschreiben.
Die Beispiele werden vom App-Store nicht automatisch installiert. Einträge
unter Container-`environment` ersetzen Compose-Variablen nicht.

## Datenbanken und vorhandene Installationen

Neue PostgreSQL-Vorlagen verwenden den für PostgreSQL 18 vorgesehenen Mount-Pfad
`/var/lib/postgresql`. Ein Hauptversionswechsel bestehender PostgreSQL-Datenbanken
benötigt eine Migration. Auch bei anderen Anwendungen die Upgradehinweise beachten.
Die Katalogaktualisierung überschreibt keine installierten Compose-Dateien und
ändert keine laufenden NAS-Stacks.

## Prüfung

- Alle 50 Compose-Vorlagen und elf Python-Tests lokal geprüft.
- [Katalog-CI](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489898):
  51 bestandene Tests mit unverändertem TitanOS 0.20.2, tatsächlichem Docker
  Compose, allen Standardtags und unterschiedlichen gesetzten Tags pro Container.
- [Registry- und Variableninventar](https://github.com/ra5on/TitanOS-Apps/blob/catalog-2026.10.25/docs/validation/catalog-images-2026-10-25.json)
  mit den tatsächlich abgefragten Manifest-Digests. n8n drosselte den direkten
  Metadatenabruf mit HTTP 429; sein aktuelles Image startete im Laufzeittest.
- [Immich-Prüfbericht](https://github.com/ra5on/TitanOS-Apps/blob/catalog-2026.10.25/docs/validation/immich-2026-10-25.json): synthetischer Foto-
  Upload, bytegenauer Download, Vorschaubild, echte CPU-ML-Inferenz und Vektorsuche
  einschließlich Erhalt nach Container-Neuerstellung.

Die vorhandenen Start-/Funktionstests für **24 Apps** sind bestanden:

- [Immich](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489936)
- [Frigate](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489906)
- [Nextcloud/MariaDB/Cron](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489930)
- [Paperless/Jellyfin](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489927)
- [Joplin/Zigbee2MQTT/ESPHome/n8n/Mealie/Grocy](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489932)
- [Trilium/Mosquitto/PairDrop](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139899659)
- [Thunderbird](https://github.com/ra5on/TitanOS-Apps/actions/runs/40139489916)
- [Spiele/Firefox/Matrix/Mattermost](https://github.com/ra5on/TitanOS-Apps/actions/runs/40138837590)

Dabei wurden unter anderem PostgreSQL 18 in Joplin, Matrix und Mattermost sowie
Nextcloud 35.0.2 mit MariaDB 13.0.2 und Cron geprüft. Der Jellyfin-Test registriert
den Medienpfad ausdrücklich und verwendet eine Musikordnerstruktur; der
Thunderbird-Test wartet auf gestartete Anwendung und initialisiertes Profil.
Im letzten Trilium-Lauf konnte das optionale Screenshot-Artefakt wegen eines
Capture-Timeouts nicht erzeugt werden. Anmeldung,
API-Schutz, Notizerzeugung und Datenerhalt waren erfolgreich und bleiben
verbindliche Funktionsprüfungen.

Die einzelnen Laufzeittests verwenden ausschließlich isolierte Runner,
synthetische Konten und neue Daten. Nicht alle 50 Anwendungen wurden vollständig
funktionell abgenommen. Migrationen vorhandener Datenbanken, echte NAS-Hardware,
GPU-Beschleunigung, reale Mailkonten, physische Zigbee-Geräte und vollständige
Spielrunden sind damit nicht geprüft. Image-Verfügbarkeit ist keine vollständige
Funktionsabnahme; `latest` kann nach diesem Prüfstand weiterwandern.

Images, Anwendungen und abgeleitete Vorlagen behalten ihre jeweiligen Lizenzen;
die Immich-Vorlage bleibt AGPL-3.0-only.
