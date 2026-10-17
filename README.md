# TitanOS Apps

Offizieller App-Katalog für TitanOS. Jede App liegt in einem eigenen Ordner
mit `compose.yaml` und deutsch-/englischsprachigen `x-titanos`-Metadaten.

## Webadressen und Icons

- `x-titanos.icon`: HTTPS-URL des Original-Icons. Die Links in `icons.json`
  zeigen auf die jeweiligen Projekte; Bilder werden nicht unter TitanOS-Lizenz
  neu veröffentlicht. Namen und Marken bleiben bei ihren Eigentümern.
- `services.<main>.labels.titanos.webui`: vollständige Adresse mit `[host]`,
  Host-Port und gegebenenfalls Pfad. TitanOS passt den Port bei Installation an.
- `titanos.public-url`: optionale vollständige öffentliche HTTP-/HTTPS-Adresse,
  in TitanOS beim Installieren oder Bearbeiten eintragbar, etwa die Cloudflare-URL.
  Das Label erstellt weder Tunnel noch Portfreigaben.
- Tailscale verwendet dieselben Ports/Pfade wie der lokale Zugriff. Feste
  externe Domains werden nicht umgeschrieben. Der Client braucht Tailnet-Zugang.

Bambu Studio und Frigate verwenden standardmäßig HTTPS mit eigenem Zertifikat.
Pi-hole öffnet `/admin/`; die aktuelle Vorlage veröffentlicht nur den HTTP-Port.
Vaultwarden benötigt für den Web-Tresor einen sicheren Browserkontext: HTTPS am
Reverse-Proxy einrichten und die entsprechende öffentliche URL hinterlegen.
Sein interner Container-Port bleibt HTTP. Ollama und cloudflared erhalten keinen
Web-UI-Knopf, weil diese Vorlagen keine lokale Benutzeroberfläche bereitstellen.

## Storytold / Craft-Apps

Der Workflow `Storytold web images` prüft alle sechs Stunden sowie manuell neue
stabile Releases der acht konfigurierten Craft-Apps. Er lädt die offiziellen
Web-ZIPs, prüft Größe und SHA-256 aus GitHubs Release-Metadaten und übernimmt die
Original-Lizenztexte und Quellverweise der exakten Version. Anschließend baut
er ein schlankes, nicht privilegiertes NGINX-Image und prüft HTTP, fehlende
Dateien und den Start des WebAssembly-Canvas in Chromium. Erst danach werden
versionierte Images und `latest` nach GHCR übertragen und Katalogeinträge
aktualisiert. Scheitern Prüfungen, wird die betroffene neue Version nicht
veröffentlicht. Alte versionierte Images bleiben für Rückwechsel verfügbar.
Die GHCR-Pakete müssen öffentlich lesbar sein, bevor die Apps angeboten werden.

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

## Prüfungen

`python3 -m unittest discover -s scripts -p 'test_*.py' -v`

Compose-Prüfung und Image-Browsertests laufen in GitHub Actions auf isolierten
Runnern. Dort werden keine produktiven NAS-Daten eingebunden. Ein erfolgreicher
Starttest behauptet keine vollständige Funktionsgleichheit mit den Desktop-Apps.
