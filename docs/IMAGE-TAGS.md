# Image-Tags je Container

Alle 50 Apps und 66 Dienste verwenden eigene Compose-Variablen. Ohne gesetzte
Variable gilt die Vorgabe in der Tabelle. Jede App enthält die passenden Einträge
in `.env.example`. Diese Datei dient als Vorlage und wird nicht automatisch vom
TitanOS-App-Store installiert.

Beispiel für gemeinsam festgelegte Immich-Server-/ML-Versionen in der
Compose-Umgebung (`.env`):

```dotenv
IMMICH_IMMICH_SERVER_IMAGE_TAG=v3.3.5
IMMICH_IMMICH_MACHINE_LEARNING_IMAGE_TAG=v3.3.5
```

Vorhandene `.env`-Dateien ergänzen und generierte Datenbankpasswörter beibehalten.
Ein gleichnamiger Wert unter `services.<dienst>.environment` ersetzt die
Compose-Umgebung nicht. Ohne `.env` lässt sich der Wert hinter `:-` im Image-Feld
oder in der Compose-Ansicht ändern. Ein wörtliches versioniertes Image im
vorhandenen Dienst-Editor hat weiterhin Vorrang vor einer Variablenreferenz.

`latest` ist der Standard, wo der Herausgeber ihn anbietet. Frigate nennt den
aktuellen Kanal `stable`, Immich Server/ML `release` und das VectorChord-Image
`pg18-latest`. Für diese Images wurde `latest` mit HTTP 404 beantwortet.
PostgreSQL-Hauptversionswechsel erfordern eine Datenmigration; Katalogänderungen
schreiben keine bestehenden Installationen um.

Die Katalog-CI prüft alle Vorgaben und unterschiedliche gesetzte Tags für jeden
Container mit dem echten Docker-Compose-Parser und unverändertem TitanOS 0.20.2.
Dies ist keine vollständige Funktionsabnahme aller Anwendungen.

| App | Dienst | Compose-Variable | Vorgabe |
| --- | --- | --- | --- |
| adguard | adguard | `ADGUARD_ADGUARD_IMAGE_TAG` | `latest` |
| bambu-lab | bambustudio | `BAMBU_LAB_BAMBUSTUDIO_IMAGE_TAG` | `latest` |
| cadcraft | cadcraft | `CADCRAFT_CADCRAFT_IMAGE_TAG` | `latest` |
| cloudflare-tunnel | cloudflared | `CLOUDFLARE_TUNNEL_CLOUDFLARED_IMAGE_TAG` | `latest` |
| deckcraft | deckcraft | `DECKCRAFT_DECKCRAFT_IMAGE_TAG` | `latest` |
| deepseek-harness | dsh | `DEEPSEEK_HARNESS_DSH_IMAGE_TAG` | `latest` |
| designcraft | designcraft | `DESIGNCRAFT_DESIGNCRAFT_IMAGE_TAG` | `latest` |
| effectcraft | effectcraft | `EFFECTCRAFT_EFFECTCRAFT_IMAGE_TAG` | `latest` |
| esphome | esphome | `ESPHOME_ESPHOME_IMAGE_TAG` | `latest` |
| figcraft | figcraft | `FIGCRAFT_FIGCRAFT_IMAGE_TAG` | `latest` |
| filmcraft | filmcraft | `FILMCRAFT_FILMCRAFT_IMAGE_TAG` | `latest` |
| firefox | firefox | `FIREFOX_FIREFOX_IMAGE_TAG` | `latest` |
| frigate | frigate | `FRIGATE_FRIGATE_IMAGE_TAG` | `stable` |
| gridcraft | gridcraft | `GRIDCRAFT_GRIDCRAFT_IMAGE_TAG` | `latest` |
| grocy | grocy | `GROCY_GROCY_IMAGE_TAG` | `latest` |
| hermes-agent | hermes | `HERMES_AGENT_HERMES_IMAGE_TAG` | `latest` |
| immich | immich-server | `IMMICH_IMMICH_SERVER_IMAGE_TAG` | `release` |
| immich | immich-machine-learning | `IMMICH_IMMICH_MACHINE_LEARNING_IMAGE_TAG` | `release` |
| immich | redis | `IMMICH_REDIS_IMAGE_TAG` | `latest` |
| immich | database | `IMMICH_DATABASE_IMAGE_TAG` | `pg18-latest` |
| jellyfin | jellyfin | `JELLYFIN_JELLYFIN_IMAGE_TAG` | `latest` |
| joplin-server | db | `JOPLIN_SERVER_DB_IMAGE_TAG` | `latest` |
| joplin-server | joplin | `JOPLIN_SERVER_JOPLIN_IMAGE_TAG` | `latest` |
| lightcraft | lightcraft | `LIGHTCRAFT_LIGHTCRAFT_IMAGE_TAG` | `latest` |
| matrix-element | matrix | `MATRIX_ELEMENT_MATRIX_IMAGE_TAG` | `latest` |
| matrix-element | init | `MATRIX_ELEMENT_INIT_IMAGE_TAG` | `latest` |
| matrix-element | db | `MATRIX_ELEMENT_DB_IMAGE_TAG` | `latest` |
| matrix-element | synapse | `MATRIX_ELEMENT_SYNAPSE_IMAGE_TAG` | `latest` |
| matrix-element | admin-init | `MATRIX_ELEMENT_ADMIN_INIT_IMAGE_TAG` | `latest` |
| matrix-element | element | `MATRIX_ELEMENT_ELEMENT_IMAGE_TAG` | `latest` |
| mattermost | mattermost | `MATTERMOST_MATTERMOST_IMAGE_TAG` | `latest` |
| mattermost | db | `MATTERMOST_DB_IMAGE_TAG` | `latest` |
| mattermost | init | `MATTERMOST_INIT_IMAGE_TAG` | `latest` |
| mealie | mealie | `MEALIE_MEALIE_IMAGE_TAG` | `latest` |
| minecraft-bedrock | bedrock | `MINECRAFT_BEDROCK_BEDROCK_IMAGE_TAG` | `latest` |
| minecraft-java | minecraft | `MINECRAFT_JAVA_MINECRAFT_IMAGE_TAG` | `latest` |
| mosquitto | mosquitto | `MOSQUITTO_MOSQUITTO_IMAGE_TAG` | `latest` |
| n8n | n8n | `N8N_N8N_IMAGE_TAG` | `latest` |
| nextcloud | mariadb | `NEXTCLOUD_MARIADB_IMAGE_TAG` | `latest` |
| nextcloud | nextcloud | `NEXTCLOUD_NEXTCLOUD_IMAGE_TAG` | `latest` |
| nextcloud | nextcloud-cron | `NEXTCLOUD_NEXTCLOUD_CRON_IMAGE_TAG` | `latest` |
| node-red | node-red | `NODE_RED_NODE_RED_IMAGE_TAG` | `latest` |
| ollama | ollama | `OLLAMA_OLLAMA_IMAGE_TAG` | `latest` |
| pairdrop | pairdrop | `PAIRDROP_PAIRDROP_IMAGE_TAG` | `latest` |
| palworld | palworld | `PALWORLD_PALWORLD_IMAGE_TAG` | `latest` |
| paperless-ngx | db | `PAPERLESS_NGX_DB_IMAGE_TAG` | `latest` |
| paperless-ngx | broker | `PAPERLESS_NGX_BROKER_IMAGE_TAG` | `latest` |
| paperless-ngx | paperless | `PAPERLESS_NGX_PAPERLESS_IMAGE_TAG` | `latest` |
| pdfcraft | pdfcraft | `PDFCRAFT_PDFCRAFT_IMAGE_TAG` | `latest` |
| photocraft | photocraft | `PHOTOCRAFT_PHOTOCRAFT_IMAGE_TAG` | `latest` |
| pihole | pihole | `PIHOLE_PIHOLE_IMAGE_TAG` | `latest` |
| satisfactory | satisfactory | `SATISFACTORY_SATISFACTORY_IMAGE_TAG` | `latest` |
| solidcraft | solidcraft | `SOLIDCRAFT_SOLIDCRAFT_IMAGE_TAG` | `latest` |
| soundcraft | soundcraft | `SOUNDCRAFT_SOUNDCRAFT_IMAGE_TAG` | `latest` |
| syncthing | syncthing | `SYNCTHING_SYNCTHING_IMAGE_TAG` | `latest` |
| terraria | terraria | `TERRARIA_TERRARIA_IMAGE_TAG` | `latest` |
| thunderbird | thunderbird | `THUNDERBIRD_THUNDERBIRD_IMAGE_TAG` | `latest` |
| titanos-agent | agent | `TITANOS_AGENT_AGENT_IMAGE_TAG` | `latest` |
| trilium | trilium | `TRILIUM_TRILIUM_IMAGE_TAG` | `latest` |
| uptime-kuma | uptime-kuma | `UPTIME_KUMA_UPTIME_KUMA_IMAGE_TAG` | `latest` |
| valheim | valheim | `VALHEIM_VALHEIM_IMAGE_TAG` | `latest` |
| vaultwarden | vaultwarden | `VAULTWARDEN_VAULTWARDEN_IMAGE_TAG` | `latest` |
| vectorcraft | vectorcraft | `VECTORCRAFT_VECTORCRAFT_IMAGE_TAG` | `latest` |
| wordcraft | wordcraft | `WORDCRAFT_WORDCRAFT_IMAGE_TAG` | `latest` |
| zigbee2mqtt | broker | `ZIGBEE2MQTT_BROKER_IMAGE_TAG` | `latest` |
| zigbee2mqtt | zigbee2mqtt | `ZIGBEE2MQTT_ZIGBEE2MQTT_IMAGE_TAG` | `latest` |
