# Image-Tags je Container

Alle 53 Apps und 69 Dienste verwenden wörtliche Image-Referenzen. In TitanOS
0.21.0 ist das **Image-Tag**-Feld für jeden Dienst direkt bearbeitbar, beim
Installieren und im bestehenden Diensteditor. Formular und Compose-Ansicht
halten dieselbe Auswahl; nach erneutem Öffnen bleiben die Tags erhalten.
Zusätzliche Compose-Variablen oder Beispieldateien sind nicht nötig.

`latest` ist der Standard, wo der Herausgeber ihn anbietet. Frigate nennt den
aktuellen Kanal `stable`, Immich Server/ML `release` und das VectorChord-Image
`pg18-latest`. Die aktuellen Registry-Abfragen für `latest` dieser vier Images
liefern HTTP 404. Zusammengehörige Dienste auf kompatiblen Versionen halten.
PostgreSQL-Hauptversionswechsel benötigen eine Datenmigration.

Bestehende Compose-Dateien und `.env`-Geheimnisse werden durch Katalogänderungen
nicht verändert. Alte Tag-Variablen bleiben in vorhandenen Installationen gültig;
diese lassen sich weiterhin im vollständigen Image-Feld oder in YAML bearbeiten.

Die Katalog-CI verwendet die unveränderten Installations-/Editorfunktionen aus
TitanOS v0.21.0 und echtes Docker Compose. Sie prüft Vorgaben, unabhängige Tags
je Dienst, unterschiedliche Tags innerhalb aller Stacks, erneutes Öffnen und
unveränderte Pfade/Geheimnisse. Registry-Prüfungen und Laufzeittests werden
separat mit Datum und Grenzen dokumentiert. Eine Compose-Prüfung ersetzt keine
vollständige Funktionsabnahme jeder Anwendung.

| App | Dienst | Image-Vorgabe |
| --- | --- | --- |
| adguard | adguard | `adguard/adguardhome:latest` |
| bambu-lab | bambustudio | `lscr.io/linuxserver/bambustudio:latest` |
| cadcraft | cadcraft | `ghcr.io/ra5on/titanos-cadcraft:latest` |
| cloudflare-tunnel | cloudflared | `cloudflare/cloudflared:latest` |
| convertx | convertx | `ghcr.io/c4illin/convertx:latest` |
| deckcraft | deckcraft | `ghcr.io/ra5on/titanos-deckcraft:latest` |
| deepseek-harness | dsh | `node:latest` |
| designcraft | designcraft | `ghcr.io/ra5on/titanos-designcraft:latest` |
| effectcraft | effectcraft | `ghcr.io/ra5on/titanos-effectcraft:latest` |
| esphome | esphome | `ghcr.io/esphome/esphome:latest` |
| figcraft | figcraft | `ghcr.io/ra5on/titanos-figcraft:latest` |
| filmcraft | filmcraft | `ghcr.io/ra5on/titanos-filmcraft:latest` |
| firefox | firefox | `jlesage/firefox:latest` |
| frigate | frigate | `ghcr.io/blakeblackshear/frigate:stable` |
| gridcraft | gridcraft | `ghcr.io/ra5on/titanos-gridcraft:latest` |
| grocy | grocy | `lscr.io/linuxserver/grocy:latest` |
| hermes-agent | hermes | `nousresearch/hermes-agent:latest` |
| immich | immich-server | `ghcr.io/immich-app/immich-server:release` |
| immich | immich-machine-learning | `ghcr.io/immich-app/immich-machine-learning:release` |
| immich | redis | `docker.io/valkey/valkey:latest` |
| immich | database | `ghcr.io/tensorchord/vchord-suite:pg18-latest` |
| jdownloader-2 | jdownloader | `jlesage/jdownloader-2:latest` |
| jellyfin | jellyfin | `jellyfin/jellyfin:latest` |
| joplin-server | db | `postgres:latest` |
| joplin-server | joplin | `joplin/server:latest` |
| lightcraft | lightcraft | `ghcr.io/ra5on/titanos-lightcraft:latest` |
| matrix-element | matrix | `nginx:latest` |
| matrix-element | init | `ghcr.io/element-hq/synapse:latest` |
| matrix-element | db | `postgres:latest` |
| matrix-element | synapse | `ghcr.io/element-hq/synapse:latest` |
| matrix-element | admin-init | `ghcr.io/element-hq/synapse:latest` |
| matrix-element | element | `ghcr.io/element-hq/element-web:latest` |
| mattermost | mattermost | `mattermost/mattermost-team-edition:latest` |
| mattermost | db | `postgres:latest` |
| mattermost | init | `python:latest` |
| mealie | mealie | `ghcr.io/mealie-recipes/mealie:latest` |
| minecraft-bedrock | bedrock | `itzg/minecraft-bedrock-server:latest` |
| minecraft-java | minecraft | `itzg/minecraft-server:latest` |
| mosquitto | mosquitto | `eclipse-mosquitto:latest` |
| music-assistant | music-assistant | `ghcr.io/music-assistant/server:latest` |
| n8n | n8n | `docker.n8n.io/n8nio/n8n:latest` |
| nextcloud | mariadb | `mariadb:latest` |
| nextcloud | nextcloud | `nextcloud:latest` |
| nextcloud | nextcloud-cron | `nextcloud:latest` |
| node-red | node-red | `nodered/node-red:latest` |
| ollama | ollama | `ollama/ollama:latest` |
| pairdrop | pairdrop | `lscr.io/linuxserver/pairdrop:latest` |
| palworld | palworld | `thijsvanloef/palworld-server-docker:latest` |
| paperless-ngx | db | `postgres:latest` |
| paperless-ngx | broker | `valkey/valkey:latest` |
| paperless-ngx | paperless | `ghcr.io/paperless-ngx/paperless-ngx:latest` |
| pdfcraft | pdfcraft | `ghcr.io/ra5on/titanos-pdfcraft:latest` |
| photocraft | photocraft | `ghcr.io/ra5on/titanos-photocraft:latest` |
| pihole | pihole | `pihole/pihole:latest` |
| satisfactory | satisfactory | `robtme/satisfactory-server:latest` |
| solidcraft | solidcraft | `ghcr.io/ra5on/titanos-solidcraft:latest` |
| soundcraft | soundcraft | `ghcr.io/ra5on/titanos-soundcraft:latest` |
| syncthing | syncthing | `syncthing/syncthing:latest` |
| terraria | terraria | `ghcr.io/crosis47/tmodloader:latest` |
| thunderbird | thunderbird | `jlesage/thunderbird:latest` |
| titanos-agent | agent | `ghcr.io/ra5on/titanos-agent:latest` |
| trilium | trilium | `triliumnext/trilium:latest` |
| uptime-kuma | uptime-kuma | `louislam/uptime-kuma:latest` |
| valheim | valheim | `ghcr.io/community-valheim-tools/valheim-server:latest` |
| vaultwarden | vaultwarden | `vaultwarden/server:latest` |
| vectorcraft | vectorcraft | `ghcr.io/ra5on/titanos-vectorcraft:latest` |
| wordcraft | wordcraft | `ghcr.io/ra5on/titanos-wordcraft:latest` |
| zigbee2mqtt | broker | `eclipse-mosquitto:latest` |
| zigbee2mqtt | zigbee2mqtt | `ghcr.io/koenkk/zigbee2mqtt:latest` |
