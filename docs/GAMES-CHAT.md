# Gameserver, Firefox und Teamchat

Neun Katalogeinträge, Stand 24. Oktober 2026. Ein Merge in `main` veröffentlicht
sie über die bestehende TitanOS-Apps-Quelle. Ein OS-/App-Update von TitanOS ist
hierfür nicht erforderlich. Bereits installierte Apps werden nicht verändert.

| Eintrag | Image / Start | Zugriff |
| --- | --- | --- |
| Minecraft Java | `itzg/minecraft-server:2026.10.0-java25`, Vanilla und aktuelle stabile Spielversion | Java-Client, TCP 25565; RCON nur intern |
| Minecraft Bedrock | `itzg/minecraft-bedrock-server:latest` | Bedrock-Client, TCP 19132 und UDP 19140–19155; Xbox-Authentifizierung aktiv |
| Valheim | `ghcr.io/community-valheim-tools/valheim-server:latest` | Steam-Client, UDP 2456–2458, privates Serverpasswort |
| Terraria / tModLoader | `ghcr.io/crosis47/tmodloader:latest` | passender tModLoader-Client, NAS-TCP 7778 → Container 7777 |
| Satisfactory | `robtme/satisfactory-server:latest` | Server-Manager im Spiel; TCP/UDP 7777 und TCP 8888 |
| Palworld | `thijsvanloef/palworld-server-docker:v2.8.1` | Spielclient, UDP 8211; REST-API nur intern |
| Firefox | `jlesage/firefox:v26.09.1` | HTTPS 5801 → Container 5800 mit eigener Anmeldung |
| Matrix + Element | Synapse `v1.163.2`, Element Web `v1.12.32`, PostgreSQL 17 und Nginx | gemeinsames HTTPS-Gateway 8448 |
| Mattermost | Team Edition `12.0.1`, PostgreSQL 17, einmalige Python-Vorbereitung | HTTP 8065, eigenes Benutzerkonto |

## Installation und Betrieb

Alle Ports sind Vorgaben. Spielport, NAS-Freigabe und gegebenenfalls angekündigter
öffentlicher Port müssen zusammenpassen. Bei Satisfactory TCP und UDP sowie
`SERVERGAMEPORT` gemeinsam ändern; der Nachrichtenport und `SERVERMESSAGINGPORT`
müssen ebenfalls zusammenpassen. Valheim verwendet eine zusammengehörige
UDP-Portgruppe. Bestehende Portbelegungen im TitanOS-Installationsformular prüfen.
Routerfreigaben werden nicht angelegt.

Minecraft verlangt in beiden Formularen eine ausdrückliche EULA-Eingabe `TRUE`.
`ONLINE_MODE` bleibt an. Java 25 ist für die aktuelle Spielversion vorgesehen;
ältere Modpacks können ein anderes Java-Image benötigen. Java und Bedrock sind
getrennte Editionen. Konsolen können das Hinzufügen privater Bedrock-Server
beschränken. Bedrock nutzt NetherNet mit TCP-Signalisierung und einem festen
UDP-Portbereich. `SERVER_UDP_PORTS` muss die vom Client erreichbare NAS-IP und
die beiden Bereiche enthalten. Die 16 einzelnen UDP-Portabbildungen müssen
mit dem angekündigten Bereich übereinstimmen. Die zusätzliche Namens-Allowlist
ist aus; Xbox-Authentifizierung bleibt an. Terraria startet über tModLoader; Vanilla-Clients sind dafür ungeeignet.

Valheim aktualisiert die Serverdateien beim Start und prüft täglich um 05:00 Uhr
auf Updates, wenn niemand verbunden ist. Palworld und Satisfactory laden beim
Start ihre Serverdateien von Steam. Der erste Start braucht entsprechend Zeit,
freien Speicher und eine Internetverbindung. Für Satisfactory mindestens 12 GB,
für Palworld mindestens 16 GB verfügbaren Server-RAM einplanen; große Welten
und viele Spieler benötigen mehr. Diese Werte sind keine Leistungsmessung auf
TitanOS-Hardware. Welten vor Versionswechseln sichern.

Firefox besitzt pro Installation ein gemeinsames Profil mit Cookies,
Downloads und gespeicherten Anmeldungen. Für getrennte Personen jeweils eine
eigene Installation, Datenverzeichnisse und Zugangsdaten verwenden. Das
selbstsignierte Zertifikat wird beim ersten Start erzeugt. VNC ist nicht
veröffentlicht. Die Firefox-Anmeldung ist unabhängig vom TitanOS-Konto.

Matrix erstellt ein dauerhaftes Serverprofil, Synapse-Schlüssel, eine eigene
Datenbank und das im Formular angegebene Administratorkonto. Der Servername ist
Teil der Konto-IDs und bleibt nach dem ersten Start unveränderlich. Die öffentliche
HTTPS-Adresse muss einschließlich NAS-Port genau stimmen. Der lokale Zugang
verwendet ein selbstsigniertes Zertifikat. Für Element-Medien und Service Worker
muss der Browser diesem Zertifikat vertrauen; das bloße Übergehen einer Warnung
reicht nicht. Das öffentliche Zertifikat kann unter `/titanos-matrix.crt` geladen
werden. Den SHA-256-Fingerabdruck vorher mit dem Fingerabdruck im Log des
Matrix-init-Dienstes vergleichen. Beim erneuerten
Zertifikat muss das Vertrauen erneuert werden. Alternativ einen HTTPS-Proxy mit
vertrauenswürdigem Zertifikat einrichten; dies gilt auch für externe Clients. Element und Matrix-API
liegen unter derselben Adresse. Das Gateway leitet die Synapse-Admin-API nicht
weiter. Offene Registrierung und Föderation sind deaktiviert. Weitere Konten
über `register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008`
in der Synapse-Konsole anlegen. Es wird keine Telefonie-Infrastruktur eingerichtet.

Mattermost Team Edition enthält eine eigene PostgreSQL-Datenbank. Beim ersten
Öffnen das erste Administratorkonto anlegen und weitere Personen einladen.
`MM_SERVICESETTINGS_SITEURL` muss zur gewählten Adresse passen. Für Fernzugriff
HTTPS separat einrichten. Der einmalige Python-Container bereitet Berechtigungen
und die URL-kodierte Datenbankverbindung vor; das Mattermost-Image selbst benötigt
keine Shell. Bestehende Konfiguration bleibt beim erneuten Vorbereiten erhalten,
nur die Datenbankverbindung folgt dem installierten Geheimnis. SMTP und
Anruf-Infrastruktur sind nicht vorkonfiguriert. Keine gemeinsame Anmeldung mit TitanOS.

## Speicher und Sicherung

Bind-Mounts bleiben relativ zum App-Ordner auf dem ausgewählten Daten-Volume.
Valheim legt auch die heruntergeladenen Serverdateien dort ab. tModLoader
speichert Welten, Mods und Modkonfiguration in `/data`; auch .NET und tModLoader werden beim ersten Start nach `/data` heruntergeladen.
Der erste Start benötigt daher eine Internetverbindung. Das optionale Web-Dashboard
und spätere automatische Spielupdates sind ausgeschaltet.
Die schweren Daten gehören nie auf den USB-Stick oder ins RAM-Overlay.

Matrix verwendet die projektspezifischen Docker-Volumes `matrix-data`
(Identität, Schlüssel, Medien und Konfiguration) und `matrix-generated`
(TLS-Zertifikat und Gateway-/Element-Konfiguration), PostgreSQL den angebotenen
Datenbankpfad. Mattermost verwendet je ein projektspezifisches Docker-Volume für
Konfiguration, Daten, Logs, Plugins, Client-Plugins und Suchindex sowie einen
separaten PostgreSQL-Pfad. Docker-Volumes liegen im ausgewählten Docker-
Datenverzeichnis. Gemeinsame Volumes vermeiden auseinanderlaufende Pfade zwischen
Vorbereitung und Anwendung. Es werden keine festen globalen Volume-Namen gesetzt.

Datenbank, Anwendungsdaten, Schlüssel und die zugehörigen Compose-/Geheimnisdateien
zusammen sichern. Datenbanken dafür sauber stoppen oder konsistente Datenbank-
Backups verwenden. `docker compose down --volumes` löscht benannte Volumes und
ist ausschließlich Bestandteil des Wegwerf-Tests, keine Sicherungsanweisung.

## Automatisierte Prüfung

`scripts/games-chat-smoke.mjs` verwendet nur temporäre Verzeichnisse,
projektspezifische Netzwerke/Volumes und zufällige, an Loopback gebundene Ports
auf Wegwerf-Runnern. Keine echten Konten, NAS-Freigaben oder Produktivdaten.

| Eintrag | Prüfung mit tatsächlichem Container |
| --- | --- |
| Minecraft Java | Serverlisten-Protokoll, internes RCON, erzeugte Welt, Wiederanlauf nach Neuerstellung |
| Minecraft Bedrock | NetherNet-Signalisierung, erzeugte Welt, Wiederanlauf nach Neuerstellung |
| Valheim | privater Serverstart und gebundener UDP-Port, gespeicherte Welt, Wiederanlauf nach Neuerstellung |
| Terraria / tModLoader | gestarteter Server, TCP-Port, gespeicherte Welt, Wiederanlauf nach Neuerstellung |
| Satisfactory | HTTPS-API, Erstbeanspruchung, Passwortanmeldung und erhaltene Serverkonfiguration |
| Palworld | authentifizierte REST-API, falsches Passwort abgewiesen, Welt speichern und wieder laden |
| Firefox | HTTPS, falsches Passwort abgewiesen, angemeldeter Desktop mit WebSocket-Frames, Prozess und erhaltenes Profil |
| Matrix + Element | Administratoranlage, abgewiesene falsche Anmeldung/öffentliche Registrierung, Raum, Nachricht und Bild-Upload, Element-Browseranmeldung und Service Worker/Bildanzeige, erhaltene Daten nach Neuerstellung |
| Mattermost | erster Administrator, abgewiesenes falsches Passwort, Team/Kanal/Nachricht und Datei-Upload, erhaltene Daten nach Neuerstellung |

Die lokale Matrix-Browserprobe akzeptiert ausschließlich im Wegwerf-Test das
selbstsignierte Zertifikat per Chromium-Startargument; auf dem NAS muss dafür
echtes Zertifikatsvertrauen oder ein vertrauenswürdiger Proxy eingerichtet sein.

Zusätzlich werden alle neun Vorlagen mit dem tatsächlichen TitanOS-
Installationsparser aufgebaut: Pflichtfelder, erzeugte Geheimnisse und deren
Wiederverwendung sowie Pfade und WebUI-Links. Geheimnisse bleiben in der privaten
Umgebungsdatei und werden nicht in Compose eingebettet. Die Katalog-CI prüft die
Compose-Syntax aller Einträge.

Private Valheim-Server beantworten keine Steam-A2S-Abfragen; geprüft werden
daher der tatsächliche Bereitschaftsstatus, der gebundene UDP-Port und die
gespeicherte Welt.

Grenzen: keine vollständigen Spielrunden oder echten Spielclients, keine Mods,
keine externe Router-/Firewall-/Tailscale-Abnahme, keine SMTP-Zustellung, keine
Telefonie, keine NAS-Hardware-/Lastprüfung und keine automatische Sicherungs-
Wiederherstellung. Ein erreichbarer Port allein wird nicht als Anmeldung oder
vollständige Spielbarkeit gewertet. Die Prüfprotokolle des zugehörigen GitHub-
Actions-Laufs dokumentieren das konkrete Ergebnis; zukünftige Upstream-Änderungen
an beweglichen `latest`-Tags oder heruntergeladenen Spielversionen sind davon
nicht abgedeckt.

## Upstream-Unterlagen

- [Minecraft Java Image](https://github.com/itzg/docker-minecraft-server)
- [Minecraft Bedrock Image](https://github.com/itzg/docker-minecraft-bedrock-server)
- [Valheim Image](https://github.com/community-valheim-tools/valheim-server-docker)
- [tModLoader Image](https://github.com/Crosis47/tmodloader)
- [Satisfactory Image und API-Dokumentation](https://github.com/robtme/satisfactory-server)
- [Palworld Image](https://github.com/thijsvanloef/palworld-server-docker)
- [Firefox Image](https://github.com/jlesage/docker-firefox)
- [Synapse Docker-Dokumentation](https://github.com/element-hq/synapse/tree/develop/docker)
- [Element Web](https://github.com/element-hq/element-web)
- [Mattermost Docker-Konfiguration](https://github.com/mattermost/docker)
