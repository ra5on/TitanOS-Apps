# Frigate-WebUI: Prüfung vom 24. Oktober 2026

Die aktuelle Frigate-Vorlage wurde einschließlich echter Ersteinrichtung und
Chromium-Anmeldung geprüft. Der gemeldete Ausfall auf einem bestimmten NAS ist
hiermit nicht diagnostiziert: Dessen installierte Compose-Datei, Laufzustand,
Netzwerk und Browserfehler lagen nicht vor. Es wurde kein produktives NAS geändert.

## Geprüfter Stand

- Katalogbasis: `79cbb18e03e319bcb75649dae1f2e81303afb0fe`.
- Prüfcode: `06e20ac7709e99289da5d8405eea1bab38d9e7d3`.
- Image: `ghcr.io/blakeblackshear/frigate:stable`, tatsächlich gezogen als
  `ghcr.io/blakeblackshear/frigate@sha256:fd60f99ffd4eb6c42360ed4e14953e270586f239309ab3983e55b2e97ffac09a`.
- [Erfolgreicher Lauf mit beiden Varianten und Browser-Screenshots](https://github.com/ra5on/TitanOS-Apps/actions/runs/40079295096).
- [Katalog-/Compose-Prüfung](https://github.com/ra5on/TitanOS-Apps/actions/runs/40079295034).

## Ergebnisse

| Prüfung | Ergebnis |
| --- | --- |
| Start mit leerem Konfigurationsordner | Erfolgreich; Frigate erzeugt seine Standardkonfiguration selbst |
| Start mit vorbereiteter Minimal-Konfiguration | Erfolgreich |
| HTTPS-WebUI über den veröffentlichten Container-Port 8971 | Erreichbar |
| Echte Chromium-Anmeldung und sichtbares Dashboard | Erfolgreich in beiden Varianten; Screenshot der Ersteinrichtung visuell geprüft |
| JavaScript- und CSS-Dateien im Browser | Ohne fehlgeschlagene Asset-Abrufe geladen |
| Zugang ohne Anmeldung / falsches Passwort | Abgewiesen |
| Angelegtes Konto nach Container-Neuerstellung | Erhalten und erneut anmeldbar |
| Veröffentlichte Ports | 8971/TCP, 8554/TCP, 8555/TCP und UDP vorhanden |
| Interne Ports 5000 und 1984 | Nicht veröffentlicht |
| Log-Rechte und sauberes Beenden | Erfolgreich; kein OOM und kein erzwungenes SIGKILL |
| Alte Vorlage nur mit `cap_drop: ALL` | Bekannter `log-prepare`-/`chown`-Fehler reproduziert |

Der bisherige Starttest schrieb vorab eine Minimal-Konfiguration. Die Erweiterung
prüft jetzt zusätzlich die echte Ersteinrichtung ohne Konfigurationsdatei sowie
Browser-Anmeldung und Asset-Laden. Für den getesteten aktuellen Stand wurde kein
weiterer Start- oder WebUI-Fehler gefunden. Die Compose-Vorlage wurde im Rahmen
dieser Prüfung nicht verändert.

## TitanOS-Verarbeitung

Zusätzlich mit dem tatsächlichen TitanOS-Installationsparser und Container-Editor
geprüft: Image, `cap_add`, `cap_drop`, `security_opt`, Datenpfade, SHM-/Cache-
Einstellungen, Logging und Neustartverhalten bleiben erhalten. Der WebUI-Link
bleibt HTTPS; bei belegtem Host-Port 8971 folgt er dem gewählten freien Port
8972. IPv4- und IPv6-Adressen werden korrekt aufgebaut. Die vorhandenen Docker-
und Katalog-Go-Tests sowie der App-Link-Webtest bestanden.

Das Backend startet Compose mit dem App-Datenordner auf dem Volume als
Projektverzeichnis; relative Pfade zeigen deshalb nicht auf den Boot-Stick.
Die Docker-Konfiguration deaktiviert weder NAT noch veröffentlichte Ports.
Der vorhandene Firewall-Code wurde gelesen, aber nicht auf Host-Regeln angewendet.

## Bestehende Installation

Katalogaktualisierungen und Image-Updates übernehmen keine geänderte Compose-
Vorlage in eine bereits installierte App. Eine Installation aus der alten Vorlage
kann daher weiterhin ohne die erforderlichen `cap_add`-Einträge starten wollen.
Ein bloßer Container-Neustart ergänzt diese Rechte nicht. Die vorhandene Anleitung
im [README](../README.md#frigate-startet-nicht-log-prepare--chown-operation-not-permitted)
beschreibt die Änderung ohne Löschen der Konfiguration oder Aufzeichnungen.

Für den lokalen WebUI-Aufruf gilt standardmäßig `https://NAS-ADRESSE:8971`.
Ein anders gewählter NAS-Port muss auch in der Webadresse stehen. Frigate erzeugt
standardmäßig ein selbstsigniertes Zertifikat. Das ist von nicht erreichbarer
TCP-Verbindung oder einem gestoppten Container zu unterscheiden.

## Grenzen

Die Container liefen auf wegwerfbaren Ubuntu-GitHub-Runnern mit neuen temporären
Datenordnern. Testports waren nur auf Loopback an zufälligen freien Host-Ports
veröffentlicht. Der lokale Testbrowser akzeptierte das selbstsignierte
Testzertifikat nur in seinem isolierten Kontext; keine Zertifikats- oder
Sicherheitseinstellung eines produktiven Browsers wurde geändert.

Nicht abgenommen: Erreichbarkeit des betroffenen NAS im LAN/Tailnet, dessen
installierte Alt-Konfiguration, physische Hardware, Kameras, Aufzeichnungen,
GPU/Coral, echte WebRTC-/RTSP-Streams oder Reverse-Proxy-Betrieb. Eine erfolgreiche
Prüfung der Vorlage beweist nicht die Erreichbarkeit einer bestehenden Installation.

## Primärquellen

- [Frigate-Installation und offizielle Ports/Images](https://docs.frigate.video/frigate/installation/)
- [Frigate-Anmeldung](https://docs.frigate.video/configuration/authentication/)
- [Frigate-TLS und selbstsignierte Zertifikate](https://docs.frigate.video/configuration/tls/)
