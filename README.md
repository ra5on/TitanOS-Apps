# TitanOS Apps

Offizieller App-Katalog für [TitanOS](https://github.com/ra5on/TitanOS).
Installiere Anwendungen über die Weboberfläche und betreibe sie als
Docker-Container auf deinem NAS. Jede Vorlage enthält eine `compose.yaml`
mit deutsch- und englischsprachigen Beschreibungen, Eingabefeldern und Hinweisen.

[App-Katalog](#verfügbare-apps) · [Installation](#installation-in-titanos) ·
[Webzugriff](#webui-tailscale-und-öffentliche-adressen) ·
[Craft-Apps](#storytold--craft-apps) · [Prüfungen](#prüfungen)

## Installation in TitanOS

1. Ein Daten-Volume einrichten und unter **Docker** als Speicherort auswählen.
2. Unter **Apps** eine Anwendung aus der Quelle **TitanOS-Apps** (in älteren Versionen **Offiziell**) öffnen.
3. Die Hinweise der Vorlage lesen und Speicherpfade, Ports und Zugangsdaten
   im Installationsformular festlegen. Hardwarebeschleunigung nur bei Bedarf auswählen.
4. Installieren und die Anwendung anschließend unter **Docker** verwalten.
   Dort stehen je nach Anwendung WebUI, Logs, Konsole und Updates zur Verfügung.

Dieser Katalog ist in TitanOS bereits als offizielle Quelle eingetragen.
Er wird beim Start und täglich neu geladen. Katalogänderungen benötigen kein
neues TitanOS-Systemabbild; für neue Funktionen der TitanOS-Oberfläche ist
weiterhin ein entsprechendes OS-Update erforderlich.

## Verfügbare Apps

Die Links führen zur jeweiligen Compose-Vorlage mit ihren Einstellungen.

| App | Zweck |
| --- | --- |
| [AdGuard Home](adguard/compose.yaml) | DNS-Server mit Werbe- und Trackingfilter |
| [Bambu Studio](bambu-lab/compose.yaml) | 3D-Modelle im Browser vorbereiten und slicen |
| [CADCraft](cadcraft/compose.yaml) | Technische Zeichnungen und CAD-Entwürfe erstellen |
| [Cloudflare Tunnel](cloudflare-tunnel/compose.yaml) | Dienste über eigene Domains erreichbar machen |
| [DeckCraft](deckcraft/compose.yaml) | Präsentationen erstellen und bearbeiten |
| [DeepSeek Harness](deepseek-harness/compose.yaml) | KI-Agent für Dateien und Befehle in einem Arbeitsordner |
| [DesignCraft](designcraft/compose.yaml) | Seiten und Layouts gestalten |
| [Eclipse Mosquitto](mosquitto/compose.yaml) | Passwortgeschützter MQTT-Broker für Geräte und Automationen |
| [EffectCraft](effectcraft/compose.yaml) | Animationen und Effekte gestalten |
| [ESPHome](esphome/compose.yaml) | Gerätekonfiguration und Firmware mit ESPHome Device Builder erstellen |
| [FigCraft](figcraft/compose.yaml) | Oberflächen und Prototypen entwerfen |
| [FilmCraft](filmcraft/compose.yaml) | Videos bearbeiten |
| [Firefox](firefox/compose.yaml) | Firefox auf dem NAS mit geschütztem Browserzugang und dauerhaftem Profil |
| [Frigate NVR](frigate/compose.yaml) | Videoüberwachung mit Objekterkennung |
| [GridCraft](gridcraft/compose.yaml) | Tabellen und Berechnungen bearbeiten |
| [Grocy](grocy/compose.yaml) | Vorräte, Einkäufe und Haushaltsaufgaben verwalten |
| [Hermes Agent](hermes-agent/compose.yaml) | KI-Agent mit Web-Dashboard |
| [Immich](immich/compose.yaml) | Fotos und Videos verwalten und sichern |
| [Jellyfin](jellyfin/compose.yaml) | Filme, Serien und Musik an Browser, Fernseher und Mobilgeräte streamen |
| [Joplin Server](joplin-server/compose.yaml) | Notizen zwischen Joplin-Apps synchronisieren |
| [LightCraft](lightcraft/compose.yaml) | Fotos entwickeln |
| [Matrix + Element](matrix-element/compose.yaml) | Privater Matrix-Messenger mit Element-Weboberfläche, persönlichen Konten und PostgreSQL |
| [Mattermost](mattermost/compose.yaml) | Eigener Teamchat mit Kanälen, persönlichen Konten und Dateiaustausch |
| [Mealie](mealie/compose.yaml) | Rezepte, Essenspläne und Einkaufslisten verwalten |
| [Minecraft Bedrock](minecraft-bedrock/compose.yaml) | Eigener Minecraft-Bedrock-Server mit dauerhafter Welt und Xbox-Anmeldung |
| [Minecraft Java](minecraft-java/compose.yaml) | Eigener Minecraft-Java-Server mit dauerhafter Welt und optionalen Mods oder Plugins |
| [n8n](n8n/compose.yaml) | Workflows zwischen Apps und APIs automatisieren |
| [Nextcloud + MariaDB](nextcloud/compose.yaml) | Private Cloud für Dateien und Zusammenarbeit |
| [Node-RED](node-red/compose.yaml) | Abläufe und Geräte visuell automatisieren |
| [Ollama](ollama/compose.yaml) | Lokale KI-Modelle über eine API ausführen |
| [PairDrop](pairdrop/compose.yaml) | Dateien und Text zwischen Browsern übertragen |
| [Palworld](palworld/compose.yaml) | Palworld-Server mit eigener Welt, Spielerpasswort und automatischen Backups |
| [Paperless-ngx](paperless-ngx/compose.yaml) | Dokumente mit OCR archivieren und durchsuchen |
| [PdfCraft](pdfcraft/compose.yaml) | PDFs bearbeiten |
| [PhotoCraft](photocraft/compose.yaml) | Bilder bearbeiten |
| [Pi-hole](pihole/compose.yaml) | DNS-Werbeblocker mit Dashboard |
| [Satisfactory](satisfactory/compose.yaml) | Dedizierter Satisfactory-Server für eine gemeinsame Fabrik und dauerhafte Spielstände |
| [SolidCraft](solidcraft/compose.yaml) | 3D-CAD-Modelle im Browser erstellen und bearbeiten |
| [SoundCraft](soundcraft/compose.yaml) | Audio aufnehmen und bearbeiten |
| [Syncthing](syncthing/compose.yaml) | Ordner zwischen Geräten synchronisieren |
| [Terraria / tModLoader](terraria/compose.yaml) | Terraria-Server mit tModLoader, dauerhafter Welt und optionalen Workshop-Mods |
| [Thunderbird](thunderbird/compose.yaml) | Vorhandene E-Mail-Konten, Kontakte und Kalender im Browser nutzen |
| [TitanOS-Agent](titanos-agent/compose.yaml) | Mit einem lokalen Ollama-Modell über den Zustand des NAS chatten |
| [Trilium Notes](trilium/compose.yaml) | Persönliche Wissensdatenbank mit Browsereditor |
| [Uptime Kuma](uptime-kuma/compose.yaml) | Erreichbarkeit von Diensten überwachen |
| [Valheim](valheim/compose.yaml) | Valheim-Server mit geschützter Spielwelt und automatischen Welt-Backups |
| [Vaultwarden](vaultwarden/compose.yaml) | Passwortmanager für Bitwarden-Clients |
| [VectorCraft](vectorcraft/compose.yaml) | Vektorgrafiken bearbeiten |
| [WordCraft](wordcraft/compose.yaml) | Textdokumente erstellen und bearbeiten |
| [Zigbee2MQTT](zigbee2mqtt/compose.yaml) | Zigbee-Geräte mit einem privaten MQTT-Broker verbinden |

## Speicherpfade und Dokumente

Im Installationsformular lassen sich die von einer Vorlage angebotenen
NAS-Pfade festlegen. Persistente Containerdaten gehören auf ein Daten-Volume.
Ein eingebundener NAS-Pfad ist im Container unter dem zugehörigen Containerpfad
sichtbar; diese beiden Pfade können unterschiedlich heißen.

Die Craft-Web-Apps öffnen und speichern Dokumente dagegen über den Browser.
Dafür eine NAS-Freigabe auf dem verwendeten PC einbinden und im Dateidialog
wählen. Details und Grenzen stehen im Abschnitt zu den Craft-Apps weiter unten.

## WebUI, Tailscale und öffentliche Adressen

| Schaltfläche | Verwendung |
| --- | --- |
| **Web UI** | Öffnet die lokale NAS-Adresse mit dem Port und Pfad der App. |
| **Tailscale Web UI** | Verwendet bei verbundenem Tailscale-Plugin den Tailnet-Namen bzw. die Tailscale-IP. Das zugreifende Gerät benötigt Tailnet-Zugang. |
| **Öffentlich** | Öffnet die für diese App eingetragene öffentliche URL, etwa `https://app.example.org`. |

Die **Öffentliche URL** kann beim Installieren oder später im Container-Editor
hinterlegt werden. Cloudflare Tunnel bzw. Reverse-Proxy und die zugehörige
Domain müssen separat eingerichtet sein. Das URL-Feld erstellt den Link;
es richtet keinen Tunnel und keine Portfreigabe ein. Ein leeres Feld blendet
den öffentlichen Knopf aus.

HTTP oder HTTPS richtet sich nach der jeweiligen App. Tailscale übernimmt
Protokoll, Port und Pfad; es wandelt HTTP nicht automatisch in HTTPS um.
Bei selbst signierten App-Zertifikaten kann der Browser eine Ausnahme verlangen.

Bambu Studio, Frigate und Thunderbird verwenden standardmäßig HTTPS mit eigenem Zertifikat.
Pi-hole öffnet `/admin/`; die aktuelle Vorlage veröffentlicht nur den HTTP-Port.
Vaultwarden benötigt für den Web-Tresor einen sicheren Browserkontext: HTTPS am
Reverse-Proxy einrichten und die entsprechende öffentliche URL hinterlegen.
Sein interner Container-Port bleibt HTTP. Ollama und cloudflared erhalten keinen
Web-UI-Knopf, weil diese Vorlagen keine lokale Benutzeroberfläche bereitstellen.
Der TitanOS-Agent (Port `8765`) läuft über HTTP und fragt nach dem beim Installieren
erzeugten Passwort; er gehört ins Heimnetz, nicht ins Internet. Er braucht einen
API-Schlüssel aus TitanOS (ab Version mit „Agenten und API-Schlüssel“ unter
Einstellungen › Zugang) und eine laufende Ollama-App mit einem Modell, das
Werkzeuge aufrufen kann.

### Immich: Versionen je Dienst

Die Vorlage verwendet den aktuellen Immich-Kanal für Server und Machine Learning
(`release`) sowie `latest` für Valkey. Immich veröffentlicht für Server, ML und
sein PostgreSQL-Image keinen Tag namens `latest`. Die Datenbank bleibt deshalb
bei `14-vectorchord0.4.3-pgvectors0.2.0`, passend zum vorhandenen PostgreSQL-14-
Datenverzeichnis. Alle vier Images sind ohne Digest-Bindung einzeln änderbar.

Beim Installieren unter **Als Compose bearbeiten** den `image`-Eintrag des
gewünschten Dienstes ändern. Nach der Installation unter **Docker › App bearbeiten**
den Dienst auswählen und dessen **Image** ändern, zum Beispiel
`ghcr.io/immich-app/immich-server:v3.3.3` und entsprechend
`ghcr.io/immich-app/immich-machine-learning:v3.3.3`. Danach die Änderung übernehmen,
damit die Container neu erstellt werden. Ein bloßer Neustart ändert das Image nicht.

Server und ML aufeinander abstimmen; GPU-Varianten des ML-Images benötigen den
passenden Tag und die Gerätefreigabe. Vor einem Versionswechsel Fotos und Datenbank
konsistent sichern und die [Immich-Upgradehinweise](https://docs.immich.app/install/upgrading/)
lesen. Ein Wechsel der PostgreSQL-Hauptversion benötigt eine Datenbankmigration.
Bereits installierte Compose-Dateien werden durch eine Katalogaktualisierung
nicht umgeschrieben; dort vorhandene `@sha256:…`-Bindungen beim bewussten Wechsel
zusammen mit dem alten Tag ersetzen.

### Paperless-ngx: Dokumentenarchiv

Die Vorlage verwendet Paperless-ngx `3.3.4`, PostgreSQL `18` und Valkey
`9-alpine`. Nur der Web-Port `8000` wird veröffentlicht; Datenbank und Broker
bleiben im Compose-Netz. Beim Installieren einen Administratornamen festlegen
und das erzeugte Passwort aufbewahren. Weitere Konten und Dokumentrechte
werden in Paperless verwaltet, unabhängig von TitanOS-Konten.

OCR ist für Deutsch und Englisch (`deu+eng`) eingestellt. Der Eingang
`/usr/src/paperless/consume` ist ausschließlich für neue Importe gedacht:
Paperless entfernt erfolgreich importierte Originale daraus und legt sie
im Archiv ab. Keine bestehende Dokumentensammlung als Eingang auswählen.
Index/Anwendungsdaten, Dokumentarchiv, Datenbank, Broker, Eingang und Export
liegen getrennt im Datenordner der App auf dem ausgewählten Volume. Für
Sicherungen die Datenbank und Dokumentdaten konsistent gemeinsam sichern.
Office-Konvertierung über Tika/Gotenberg ist nicht Teil dieses Stacks.

Der direkte Webzugang verwendet HTTP. Für Fernzugriff Tailscale verwenden
oder HTTPS an einem separat eingerichteten Reverse-Proxy einrichten. Bei
Reverse-Proxy-Nutzung `PAPERLESS_URL` auf dessen vollständige externe Adresse
setzen; das öffentliche URL-Feld von TitanOS richtet keinen Proxy ein und
setzt diese Paperless-Einstellung nicht automatisch.

### Jellyfin: Medienserver

Die Vorlage verwendet das offizielle Image `jellyfin/jellyfin:12.3` und
veröffentlicht Web-Port `8096`. Direkt nach der Installation den Assistenten
öffnen und ein Administratorkonto mit Passwort anlegen. Weitere Personen
und Bibliotheksrechte in Jellyfin verwalten. Die TitanOS-Anmeldung wird
nicht automatisch übernommen.

Im Installationsformular einen Medienordner wählen und in Jellyfin als
`/media` zur Bibliothek hinzufügen. Medien sind standardmäßig nur lesend
eingebunden. Einstellungen und Konten liegen unter `/config`; `/cache`
enthält Cache und temporäre Transcoding-Dateien. Alle drei Pfade zeigen
auf das Daten-Volume. Weitere Bibliotheksordner können im Editor ergänzt
werden. Hardwarebeschleunigung bei Bedarf ausdrücklich für den Dienst
freigeben und zusätzlich in Jellyfin konfigurieren; die Vorlage verlangt
keine GPU und richtet kein DLNA/Host-Netzwerk ein. Fernzugriff über Tailscale
oder einen separat eingerichteten HTTPS-Reverse-Proxy verwenden.

### Thunderbird: persönliche Mailclients

Die [Thunderbird-Vorlage](thunderbird/compose.yaml) verwendet den
[Drittanbieter-Container von jlesage](https://github.com/jlesage/docker-thunderbird)
in Version `v26.09.1`, kein offizielles Image des Thunderbird-Projekts.
Beim Installieren einen Web-Benutzernamen festlegen und das erzeugte Passwort
aufbewahren. Die geschützte WebUI über **Web UI** öffnen, gegebenenfalls das
selbst signierte Zertifikat bestätigen und anschließend vorhandene Mailkonten
in Thunderbird einrichten. Ein eigener Mailserver ist dafür nicht erforderlich.

Eine Instanz entspricht einem gemeinsam bedienten Thunderbird-Profil. Für
private Konten und Einstellungen pro Person die App mehrfach mit verschiedenen
Namen installieren, zum Beispiel `thunderbird-alex` und `thunderbird-sam`.
Jede Installation erhält eigene Zugangsdaten, einen eigenen Datenordner und
einen freien Web-Port. Die Browser-Anmeldung ist unabhängig vom TitanOS-Konto;
mehrere Browser-Logins innerhalb derselben Instanz trennen keine Profile.
Alle Personen mit Zugriff auf eine Instanz sehen deren gesamten Mailclient.

`/config` enthält Profil, Kontoeinstellungen und lokale Nachrichten;
`/storage` ist für Anhänge und übertragene Dateien vorgesehen. Der Dateimanager
der WebUI ist auf `/storage` begrenzt. Beide Ordner liegen auf dem ausgewählten
Daten-Volume und sollten gesichert werden. Nur HTTPS-Port `5800` wird angeboten,
direkter VNC-Zugriff ist deaktiviert. Fernzugriff bevorzugt über Tailscale.

### Bestehende Frigate-Installation mit „manifest unknown“

Die korrigierte Vorlage verwendet `ghcr.io/blakeblackshear/frigate:stable`.
Frigate bietet den Standardkanal als `stable` statt `latest` an. Bei bereits
installierten Apps unter **Docker › App bearbeiten** das Image entsprechend
ändern und übernehmen bzw. erneut starten. Die Katalogänderung schreibt eine
vorhandene Compose-Datei nicht um. Das frühere Feld `FRIGATE_IMAGE_TAG` hatte
keine Wirkung auf das Image und wurde entfernt. Andere Varianten direkt im
Image-Feld wählen, etwa `ghcr.io/blakeblackshear/frigate:stable-tensorrt` für
NVIDIA. Vor Versionswechseln Konfiguration und Datenbank sichern.

### Frigate startet nicht: `log-prepare` / `chown: Operation not permitted`

Die frühere Vorlage entfernte mit `cap_drop: ALL` sämtliche Container-Capabilities.
Frigates s6-Start muss die Logordner unter `/dev/shm/logs` an `nobody:nogroup`
übergeben und die Logger mit dieser Identität starten. Die aktuelle Vorlage
behält `cap_drop: ALL` und `no-new-privileges`, ergänzt aber gezielt `CHOWN`,
`DAC_OVERRIDE`, `FOWNER`, `FSETID`, `SETGID`, `SETUID` und `KILL` für Dateirechte,
Benutzerwechsel und sauberes Beenden der Dienste. Kein privilegierter Modus nötig.

Bei einer bestehenden Installation unter **Docker › App bearbeiten** in der
Compose-Datei beim Dienst `frigate` ergänzen, auf derselben Ebene wie `cap_drop`:

```yaml
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - FSETID
      - SETGID
      - SETUID
      - KILL
```

Änderung übernehmen und den Container neu erstellen lassen. Ein bloßer Neustart
übernimmt geänderte Docker-Rechte nicht. Bestehende Konfiguration und Medienpfade
beibehalten; kein Löschen der App-Daten erforderlich. Eine Katalogaktualisierung
ändert bereits installierte Compose-Dateien nicht automatisch. Die Vorlage
setzt den vom Image vorgesehenen Benutzer voraus; eine selbst ergänzte `user:`-
Vorgabe für einen unprivilegierten Benutzer kann den Start weiterhin verhindern.

SolidCraft (Tangency Labs) wird wie die Craft-Apps aus dem offiziellen Web-ZIP
des jeweiligen Releases gebaut und als `ghcr.io/ra5on/titanos-solidcraft`
veröffentlicht, weil das Image des Projekts auf GHCR nicht öffentlich abrufbar ist.
Standard-Port ist `8103`. Entwürfe bleiben im jeweiligen Browser,
nicht auf dem NAS. Zum Speichern beim Zugriff von anderen Geräten HTTPS über einen
Reverse-Proxy einrichten und dessen URL in TitanOS hinterlegen. Wichtige Entwürfe
zusätzlich als Datei exportieren; NAS-Backups sichern den Browserspeicher nicht.
Siehe die [Anleitung von SolidCraft](https://docs.solidcraft.io/guide/getting-started.html).

## Notizen, Automationen und Haushalt

Node-RED und Vaultwarden sind bereits im Katalog vorhanden. Die sechs weiteren
Vorlagen verwalten ihre Konten und Einstellungen selbst; die Anmeldung an
TitanOS wird nicht automatisch übernommen.

| App | Standard-Web-Port am NAS | Erste Einrichtung |
| --- | --- | --- |
| Joplin Server | `22300` | `APP_BASE_URL` exakt einschließlich NAS-Port setzen. Anfangs `admin@localhost` / `admin`; sofort ändern und persönliche Sync-Konten anlegen. |
| Zigbee2MQTT | `8082` | Koordinator auswählen, anschließend Onboarding durchführen. Interner MQTT-Server: `mqtt://broker:1883`. |
| ESPHome | `6052` | Gewählten Benutzernamen und erzeugtes Dashboard-Passwort verwenden. |
| n8n | `5678` | Im ersten Assistenten das Besitzerkonto anlegen. |
| Mealie | `9925` | `BASE_URL` einschließlich NAS-Port setzen. Anfangs `changeme@example.com` / `MyPassword`; sofort ändern. |
| Grocy | `9283` | Anfangs `admin` / `admin`; sofort ändern und weitere Konten anlegen. |

TitanOS kann belegte Web-Ports beim Installieren ersetzen. Joplin `APP_BASE_URL`
und Mealie `BASE_URL` müssen dann zur gewählten Adresse passen. Das öffentliche
URL-Feld erzeugt nur den Link; es richtet keinen Proxy ein und ändert diese
anwendungseigenen Einstellungen nicht.

**Joplin Server** ist ein Synchronisationsziel für die Joplin-Apps, kein
Notizeditor im Browser. Die Vorlage verwendet den geprüften Image-Tag `3.7.3`
mit PostgreSQL `16`; das Datenbankpasswort wird einmal erzeugt und an beide
Dienste übergeben. Die Datenbank hat keinen veröffentlichten Port. Notizen
und Konten liegen in PostgreSQL; für ein Backup die Datenbank konsistent
sichern. Transkription ist nicht enthalten.

**Zigbee2MQTT** verwendet Version `2.14.2` mit einem privaten Mosquitto-Broker
aus dem Zweig `2`. Der Broker besitzt keine veröffentlichten Ports und darf
ohne zusätzliche Konfiguration nicht als allgemeiner MQTT-Server ins Netz
gestellt werden. Home Assistant benötigt entweder eine separat eingerichtete
Verbindung oder einen gemeinsamen MQTT-Broker, dessen Adresse in Zigbee2MQTT
eingetragen wird. Ein kompatibler USB- oder Netzwerk-Koordinator ist erforderlich.
Einzelne USB-Geräte im TitanOS-Editor ausdrücklich zuweisen; keine pauschale
USB- oder Host-Freigabe. Der erste Onboarding-Assistent ist noch nicht durch
den Frontend-Schlüssel geschützt und gehört ins vertrauenswürdige Netz.
Im regulären Frontend gilt anschließend der erzeugte Zugriffsschlüssel.

**ESPHome** verwendet `2026.10.0` mit dem Device Builder. `/config` und `/cache`
liegen auf dem Daten-Volume und halten auch Bauartefakte und Werkzeugketten.
Das Bridge-Netz begrenzt mDNS-Erkennung; gegebenenfalls Geräte-IP bzw.
`use_address` festlegen. USB-Flashen am NAS erfordert eine gezielte Gerätefreigabe.
Firmware kann alternativ heruntergeladen und auf einem anderen Rechner
geflasht werden. Kein privilegierter Container und kein Host-Netzwerk ab Werk.

**n8n** verwendet `2.44.6` mit einem benannten Daten-Volume für SQLite und
Konfiguration. Es liegt auf dem ausgewählten Docker-Daten-Volume. Den erzeugten
`N8N_ENCRYPTION_KEY` zusammen mit den Daten sichern und nicht beiläufig ersetzen;
sonst sind gespeicherte Zugangsdaten nicht mehr entschlüsselbar. Der direkte
HTTP-Zugang hat `N8N_SECURE_COOKIE=false` und gehört ins vertrauenswürdige Netz
bzw. hinter Tailscale. Bei HTTPS am separaten Reverse-Proxy auf `true` wechseln
und die externen Editor-/Webhook-Adressen konfigurieren. Webhook-Erreichbarkeit
aus dem Internet entsteht nicht durch die Installation.

**Mealie** verwendet `v3.29.0`, SQLite und einen persistenten `/app/data`-Ordner.
Registrierung ist deaktiviert. Einladungen und Passwort-Rücksetzungen per
E-Mail benötigen eine separate SMTP-Einrichtung. **Grocy** verwendet das
LinuxServer-Image mit persistentem `/config`, PUID/PGID und NAS-Zeitzone.

Alle Vorlagen enthalten deutsche und englische Hinweise. Versionswechsel
ersetzen installierte Compose-Dateien nicht automatisch. Images, Anwendungen
und Icons behalten die Rechte ihrer jeweiligen Projekte; insbesondere sind
die Nutzungsbedingungen von Joplin Server und n8n eigenständig zu prüfen.

## Trilium, Mosquitto und PairDrop

- **Trilium Notes:** Einzelbenutzer-Wissensdatenbank mit eigener Passwort-Einrichtung.
  Für jede Person eine eigene Installation mit getrenntem Datenordner und Port
  anlegen. `./data` enthält Notizen, Anhänge, Konfiguration und Trilium-Backups;
  zusätzlich außerhalb der App sichern. Die Vorlage verwendet die stabile Version
  `v0.106.1`; Desktop-Clients für die Synchronisation kompatibel halten.
- **Eclipse Mosquitto:** eigenständiger MQTT-Broker auf TCP-Port 1883 ohne WebUI.
  Ein Benutzername und ein erzeugtes Passwort sind im Formular hinterlegt; beide
  in den Clients verwenden. Anonyme Zugriffe sind gesperrt. Der vorbereitete
  gemeinsame Zugang darf alle Topics verwenden; getrennte Client-Rechte/ACLs sind
  nicht vorkonfiguriert. Retained-Nachrichten und Sitzungsdaten liegen in `./data`,
  das Passwort wird beim Start aus der App-Konfiguration übernommen. Diese samt
  Zugangsdaten ebenfalls sichern. Ohne TLS nur im vertrauenswürdigen LAN oder
  über Tailscale einsetzen. Der interne Broker der Zigbee2MQTT-Vorlage bleibt
  davon unabhängig.
- **PairDrop:** Browser auf beiden Geräten öffnen, Ziel wählen und die Übertragung
  am Empfänger annehmen. Keine Benutzerkonten und keine automatische NAS-Ablage.
  Server ohne Datenvolume; Kopplungen und Einstellungen liegen im Browser. HTTPS
  wird für dauerhafte Kopplung und weitere Browserfunktionen benötigt. Für
  öffentliche Adressen einen Reverse-Proxy mit korrektem `X-Forwarded-For`
  konfigurieren; andernfalls sehen sich alle Clients. Für netzübergreifende
  WebRTC-Verbindungen kann ein eigener TURN-Server nötig sein. Der voreingestellte
  STUN-Server ist von Google, WebSocket-Fallback ist ausgeschaltet.

Die TitanOS-Anmeldung wird von diesen Diensten nicht übernommen. Ihre Web- und
MQTT-Ports sind nach Installation direkt im Netzwerk erreichbar.

## Storytold / Craft-Apps

Der Workflow [Storytold web images](.github/workflows/storytold.yml) prüft alle sechs Stunden sowie manuell neue
stabile Releases der 14 konfigurierten Craft-Apps (13 von Storytold, dazu SolidCraft). Er lädt die offiziellen
Web-ZIPs, prüft Größe und SHA-256 aus GitHubs Release-Metadaten und übernimmt die
Original-Lizenztexte und Quellverweise der exakten Version. Anschließend baut
er ein schlankes, nicht privilegiertes NGINX-Image und prüft HTTP, fehlende
Dateien und den Start des WebAssembly-Canvas in Chromium. Erst danach werden
versionierte Images und `latest` nach GHCR übertragen und Katalogeinträge
aktualisiert. Scheitern Prüfungen, wird die betroffene neue Version nicht
veröffentlicht. Alte versionierte Images bleiben für Rückwechsel verfügbar.
Die Vorlagen beziehen ihre Images aus der GitHub Container Registry (GHCR).

DeckCraft verwendet vorerst die geprüfte Version 0.7.0, weil das offizielle
Web-Paket 0.8.0 beim Start abstürzt. Spätere Versionen werden wieder automatisch
geprüft. Bei LightCraft 0.9.1 ergänzt die Paketierung eine im offiziellen ZIP
fehlende Schrift mit Original-Lizenz und festen Prüfsummen. Einzelheiten stehen
in [den dokumentierten Upstream-Ausnahmen](docs/CRAFT-UPSTREAM.md).

AniCraft hat derzeit kein veröffentlichtes Release. Die eigentliche ArtCraft-App
bietet in ihrem aktuellen Release Windows- und macOS-Pakete, aber kein Web-Paket.
Sie sind deshalb nicht als lauffähige Web-Container im Katalog aufgeführt.

Diese Browser-Apps verarbeiten Dokumente auf dem Endgerät. Sie sind keine
serverseitigen Desktop-Sitzungen. NAS-Freigaben am PC einbinden und im normalen
Dateidialog auswählen. Ein in Docker eingebundener `/documents`-Ordner würde
allein keinen Öffnen-/Speichern-Zugriff ermöglichen; deshalb gibt es dafür
keine wirkungslose Pfadvariable. Browser-Speicherung und Export unterscheiden
sich je App. HTTPS über einen Reverse-Proxy ist für WebGPU und weitere
Browser-APIs erforderlich. Keine NAS-GPU-Durchreichung notwendig.

Der Workflow aktualisiert verfügbare Images. Bereits installierte Container
werden über die Docker-Updatefunktion des NAS aktualisiert, nicht durch diesen
Katalog. Automatische Zeitpläne können durch GitHub verzögert oder bei langer
Repository-Inaktivität deaktiviert werden; der Workflow ist auch manuell startbar.

## Vorlagen, Icons und Beiträge

Neue Apps erhalten einen eigenen Ordner mit `compose.yaml`. Die Erweiterung
`x-titanos` beschreibt Name, Hauptdienst, Kategorie, Beschreibung, Hinweise,
Variablen, Pfade und Ports. Vorhandene Vorlagen dienen als Beispiele.

- `x-titanos.icon`: HTTPS-Adresse des App-Symbols. [icons.json](icons.json)
  dokumentiert die Zuordnung. TitanOS zeigt bei nicht erreichbaren Bildern
  Namenskürzel an. Bereits installierte Container ohne Icon-Label übernehmen
  neue Symbole nicht automatisch.
- `services.<main>.labels.titanos.webui`: Webadresse mit `[host]`, Host-Port
  und gegebenenfalls Pfad. TitanOS passt den Port bei Installation an.
- `titanos.public-url`: optionale vollständige HTTP-/HTTPS-Adresse ohne
  eingebettete Zugangsdaten. Feste externe Domains werden für Tailscale
  nicht umgeschrieben.

Änderungen an automatisch erzeugten Craft-Vorlagen gehören in
[scripts/storytold.py](scripts/storytold.py), damit der nächste Aktualisierungslauf
sie erhält. Die jeweilige `release.json` hält den verwendeten Upstream-Release fest.
Neue Vorlagen und Korrekturen können als Pull Request eingereicht werden;
Probleme bitte mit App-Name, TitanOS-Version und Fehlermeldung melden.

## Prüfungen

Die [Katalogprüfung](.github/workflows/catalog.yml) führt die Python-Tests aus
und validiert sämtliche Compose-Vorlagen. Lokal mit Python 3 und Docker Compose:

```sh
python3 -m unittest discover -s scripts -p 'test_*.py' -v
for file in */compose.yaml; do
  docker compose -f "$file" config --quiet || exit 1
done
```

Die Craft-Images werden zusätzlich in GitHub Actions gebaut und im Browser
geprüft. Tests verwenden isolierte Runner ohne produktive NAS-Daten. Eine
Compose-Prüfung oder ein erfolgreicher Starttest bestätigt keine vollständige
Funktionsprüfung jeder App oder Gleichheit mit ihrer Desktop-Version.

Der [Thunderbird-Starttest](.github/workflows/thunderbird.yml) prüft HTTPS,
Ablehnung falscher Zugangsdaten, Anmeldung und Desktopübertragung im Browser,
den laufenden Thunderbird-Prozess sowie ein erhaltenes Profil nach dem
Neuerstellen des Containers. Echte Mailkonten, Versand/Empfang, OAuth,
Kalendersynchronisation und mehrere gleichzeitige Instanzen sind damit nicht
abgenommen. Die Katalogprüfung prüft zusätzlich das Frigate-`stable`-Manifest;
Kameras und Hardwarebeschleunigung benötigen gesonderte Tests.

Die [Paperless-/Jellyfin-Starttests](.github/workflows/catalog-apps.yml)
verwenden ausschließlich neue temporäre Datenordner und synthetische Inhalte.
Paperless wird mit Datenbank, Anmeldung, Import eines Rasterbilds samt OCR
und erhaltener Dokumentdatenbank nach Container-Neuerstellung geprüft.
Jellyfin wird mit Einrichtung, Anmeldung, nur lesender Medienbibliothek,
direktem Abruf einer erzeugten Audiodatei und erhaltener Konfiguration
geprüft. Beide Loginseiten werden in Chromium geladen. Reale Dokumentbestände,
Mehrbenutzer-Berechtigungen, Fernseher/Mobilgeräte, Video-Transcoding,
GPU-Beschleunigung, DLNA und Reverse-Proxy-Betrieb sind damit nicht abgenommen.

Der [Test der ausgewählten Apps](.github/workflows/selected-apps.yml) startet
sechs isolierte Stacks mit synthetischen Zugangsdaten und neuen Datenordnern
bzw. eindeutig benannten Docker-Volumes. Geprüft werden HTTP-Start, Browserseite
und Erhalt gespeicherter Daten nach Container-Neuerstellung. Dazu kommen
Joplin-Anmeldung/Datenbank, ESPHome-WebSocket-Authentifizierung, n8n-Kontoeinrichtung,
Mealie-Anmeldung sowie Grocy-Browseranmeldung. Zigbee2MQTT wird nur bis zum
Onboarding und mit einem internen MQTT-Publish/Subscribe geprüft. Keine echte
Joplin-Synchronisation, Zigbee-Kopplung, USB-/Netzwerk-Koordinatoren, Firmware-
Kompilierung oder Flash-Vorgänge, externen Workflows, Rezeptimporte oder
Mehrbenutzer-Berechtigungen behaupten. Der Test verwendet Chrome auf dem
wegwerfbaren GitHub-Runner, keine produktiven NAS-Dateien oder Host-Geräte.

Der [Frigate-Starttest](.github/workflows/frigate.yml) reproduziert zunächst
`log-prepare` ohne Capabilities und prüft danach die korrigierte Vorlage mit
isolierten Datenordnern: Log-Eigentümer und Rechte, HTTPS, Ablehnung falscher
Zugangsdaten, Anmeldung, erhaltene Konten nach Container-Neuerstellung und
sauberes Beenden. Kameras, Aufnahmen und Hardwarebeschleunigung sind damit
nicht abgenommen.

Die [Trilium-/MQTT-/PairDrop-Prüfung](.github/workflows/trilium-mosquitto-pairdrop.yml)
verwendet neue temporäre Datenordner, synthetische Zugangsdaten und Inhalte.
Trilium wird im Browser eingerichtet und angemeldet; falsches Passwort und
anonyme API-Zugriffe werden abgewiesen. Eine über ETAPI erstellte Notiz und das
Passwort müssen eine Container-Neuerstellung überstehen. Mosquitto wird über den
veröffentlichten MQTT-Port auf Anmeldung sowie Ablehnung anonymer/falscher
Zugänge geprüft; Publish/Subscribe und eine nach Neuerstellung erhaltene Retained-
Nachricht werden verifiziert. PairDrop überträgt eine Datei zwischen zwei
getrennten Browser-Kontexten; der Test vergleicht die heruntergeladenen Bytes
und prüft den Neustart des zustandslosen Servers. Nicht abgenommen sind echte
Trilium-Desktop-Synchronisation, Mehrinstanzbetrieb, MQTT-Geräte/ACLs/TLS,
PairDrop-Transfers zwischen unterschiedlichen Netzen, TURN, mobile Browser,
dauerhafte Kopplung sowie Reverse-Proxy-Betrieb.

## Lizenzen und Herkunft

Die Anwendungen, Container-Images und Logos unterliegen den Lizenzen und
Markenrechten ihrer jeweiligen Projekte. Eine Aufnahme in diesen Katalog
ändert diese Rechte nicht. Externe Icons werden verlinkt, nicht unter einer
TitanOS-Lizenz neu veröffentlicht.

Die abgeleitete Immich-Vorlage steht unter [AGPL-3.0-only](immich/LICENSE).
Die Craft-Paketierung übernimmt die Original-Lizenztexte und Quellverweise
der jeweiligen Version. Die Fair-Source-Lizenz des TitanOS-Betriebssystems
ist keine pauschale Lizenz für diese Anwendungen oder ihre Vorlagen.

## Spiele, Firefox und Teamchat

Die sechs Spiele-Vorlagen betreiben dedizierte Server; gespielt wird mit dem passenden Spiel auf PC, Konsole oder Mobilgerät. Java und Bedrock sind getrennte Minecraft-Editionen. Die Terraria-Vorlage verwendet tModLoader und benötigt einen passenden tModLoader-Client. Beide Minecraft-Vorlagen verlangen eine ausdrückliche EULA-Eingabe bei der Installation. Welten, Serverdateien und Einstellungen liegen auf dem Daten-Volume. Die großen Steam-Server brauchen beim ersten Start Zeit und mehrere Gigabyte freien Speicher; Palworld und Satisfactory brauchen entsprechend viel RAM. Die Hinweise jeder Vorlage nennen Ports und Besonderheiten.

Firefox läuft als Browserdesktop hinter HTTPS mit eigener Anmeldung. Jede Installation hat ein gemeinsames Browserprofil. Für getrennte Personen und gespeicherte Anmeldungen jeweils eine eigene Instanz anlegen. Matrix + Element startet Synapse, Element, PostgreSQL und ein HTTPS-Gateway gemeinsam. Der dauerhafte Matrix-Servername, die erreichbare HTTPS-Adresse sowie das erste Administratorkonto werden bei der Installation angegeben. Weitere Konten können in der Synapse-Konsole angelegt werden; offene Registrierung und Föderation bleiben aus. Mattermost Team Edition startet mit eigener PostgreSQL-Datenbank; das erste Administratorkonto wird in der Weboberfläche eingerichtet. Beide Chats verwenden eigene Konten. E-Mail-Versand und Anruf-Infrastruktur sind gesondert einzurichten.

Der Workflow `Games browser and chat smoke` startet die neun tatsächlichen Images mit ausschließlich synthetischen Daten auf isolierten CI-Runnern. Er prüft Protokoll-/API-Antworten, Anmeldung und dauerhaften Zustand nach dem Neuerstellen der Container. Firefox und Element werden zusätzlich in Chromium geöffnet. Vollständige Spielrunden, Mods, Konsolenverbindungen, Internetfreigaben, E-Mail-Zustellung und Leistung auf NAS-Hardware gehören nicht zu dieser Prüfung. Prüfdetails stehen in [docs/GAMES-CHAT.md](docs/GAMES-CHAT.md).
