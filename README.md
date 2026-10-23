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
| [DeepSeek Harness](deepseek-harness/compose.yaml) | KI-Agent für Dateien und Befehle in einem Arbeitsordner |
| [DeckCraft](deckcraft/compose.yaml) | Präsentationen erstellen und bearbeiten |
| [DesignCraft](designcraft/compose.yaml) | Seiten und Layouts gestalten |
| [EffectCraft](effectcraft/compose.yaml) | Animationen und Effekte gestalten |
| [ESPHome](esphome/compose.yaml) | Gerätekonfiguration und Firmware mit ESPHome Device Builder erstellen |
| [FigCraft](figcraft/compose.yaml) | Oberflächen und Prototypen entwerfen |
| [FilmCraft](filmcraft/compose.yaml) | Videos bearbeiten |
| [Frigate NVR](frigate/compose.yaml) | Videoüberwachung mit Objekterkennung |
| [GridCraft](gridcraft/compose.yaml) | Tabellen und Berechnungen bearbeiten |
| [Grocy](grocy/compose.yaml) | Vorräte, Einkäufe und Haushaltsaufgaben verwalten |
| [Hermes Agent](hermes-agent/compose.yaml) | KI-Agent mit Web-Dashboard |
| [Immich](immich/compose.yaml) | Fotos und Videos verwalten und sichern |
Die [Paperless-/Jellyfin-Starttests](.github/workflows/catalog-apps.yml)
verwenden ausschließlich neue temporäre Datenordner und synthetische Inhalte.
Paperless wird mit Datenbank, Anmeldung, Import eines Rasterbilds samt OCR
und erhaltener Dokumentdatenbank nach Container-Neuerstellung geprüft.
Jellyfin wird mit Einrichtung, Anmeldung, nur lesender Medienbibliothek,
direktem Abruf einer erzeugten Audiodatei und erhaltener Konfiguration
geprüft. Beide Loginseiten werden in Chromium geladen. Reale Dokumentbestände,
Mehrbenutzer-Berechtigungen, Fernseher/Mobilgeräte, Video-Transcoding,
GPU-Beschleunigung, DLNA und Reverse-Proxy-Betrieb sind damit nicht abgenommen.

