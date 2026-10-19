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
| [DesignCraft](designcraft/compose.yaml) | Seiten und Layouts gestalten |
| [EffectCraft](effectcraft/compose.yaml) | Animationen und Effekte gestalten |
| [FigCraft](figcraft/compose.yaml) | Oberflächen und Prototypen entwerfen |
| [FilmCraft](filmcraft/compose.yaml) | Videos bearbeiten |
| [Frigate NVR](frigate/compose.yaml) | Videoüberwachung mit Objekterkennung |
| [GridCraft](gridcraft/compose.yaml) | Tabellen und Berechnungen bearbeiten |
| [Hermes Agent](hermes-agent/compose.yaml) | KI-Agent mit Web-Dashboard |
| [Immich](immich/compose.yaml) | Fotos und Videos verwalten und sichern |
| [LightCraft](lightcraft/compose.yaml) | Fotos entwickeln |
| [Nextcloud + MariaDB](nextcloud/compose.yaml) | Private Cloud für Dateien und Zusammenarbeit |
| [Node-RED](node-red/compose.yaml) | Abläufe und Geräte visuell automatisieren |
| [Ollama](ollama/compose.yaml) | Lokale KI-Modelle über eine API ausführen |
| [PdfCraft](pdfcraft/compose.yaml) | PDFs bearbeiten |
| [PhotoCraft](photocraft/compose.yaml) | Bilder bearbeiten |
| [Pi-hole](pihole/compose.yaml) | DNS-Werbeblocker mit Dashboard |
| [SolidCraft](solidcraft/compose.yaml) | 3D-CAD-Modelle im Browser erstellen und bearbeiten |
| [SoundCraft](soundcraft/compose.yaml) | Audio aufnehmen und bearbeiten |
| [Syncthing](syncthing/compose.yaml) | Ordner zwischen Geräten synchronisieren |
| [Uptime Kuma](uptime-kuma/compose.yaml) | Erreichbarkeit von Diensten überwachen |
| [Vaultwarden](vaultwarden/compose.yaml) | Passwortmanager für Bitwarden-Clients |
| [VectorCraft](vectorcraft/compose.yaml) | Vektorgrafiken bearbeiten |
| [WordCraft](wordcraft/compose.yaml) | Textdokumente erstellen und bearbeiten |

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

Bambu Studio und Frigate verwenden standardmäßig HTTPS mit eigenem Zertifikat.
Pi-hole öffnet `/admin/`; die aktuelle Vorlage veröffentlicht nur den HTTP-Port.
Vaultwarden benötigt für den Web-Tresor einen sicheren Browserkontext: HTTPS am
Reverse-Proxy einrichten und die entsprechende öffentliche URL hinterlegen.
Sein interner Container-Port bleibt HTTP. Ollama und cloudflared erhalten keinen
Web-UI-Knopf, weil diese Vorlagen keine lokale Benutzeroberfläche bereitstellen.

SolidCraft wird aus dem offiziellen Web-Release des Projekts als
`ghcr.io/ra5on/titanos-solidcraft:latest` paketiert (Host-Port standardmäßig `8103`).
Das in der Upstream-Anleitung genannte Image verweigert derzeit anonyme Downloads.
Der Workflow stellt den Katalogeintrag erst nach Build, Browserprüfung und
anonymer Downloadprüfung auf das TitanOS-Image um. Entwürfe bleiben im jeweiligen
Browser, nicht auf dem NAS. Zum Speichern von anderen Geräten ist HTTPS über einen
Reverse-Proxy erforderlich. Wichtige Entwürfe zusätzlich als Datei exportieren;
NAS-Backups sichern den Browserspeicher nicht.

## Storytold / Craft-Apps

Der Workflow [Storytold web images](.github/workflows/storytold.yml) prüft alle sechs Stunden sowie manuell neue
stabile Releases der 14 konfigurierten Craft-Apps (einschließlich SolidCraft von Tangency Labs). Er lädt die offiziellen
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

## Lizenzen und Herkunft

Die Anwendungen, Container-Images und Logos unterliegen den Lizenzen und
Markenrechten ihrer jeweiligen Projekte. Eine Aufnahme in diesen Katalog
ändert diese Rechte nicht. Externe Icons werden verlinkt, nicht unter einer
TitanOS-Lizenz neu veröffentlicht.

Die abgeleitete Immich-Vorlage steht unter [AGPL-3.0-only](immich/LICENSE).
Die Craft-Paketierung übernimmt die Original-Lizenztexte und Quellverweise
der jeweiligen Version. Die Fair-Source-Lizenz des TitanOS-Betriebssystems
ist keine pauschale Lizenz für diese Anwendungen oder ihre Vorlagen.
