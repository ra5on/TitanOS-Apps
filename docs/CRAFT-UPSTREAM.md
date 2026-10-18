# Ergänzungen zu offiziellen Craft-Web-Paketen

Stand: 18. Oktober 2026. Alle anderen Dateien kommen weiterhin aus dem offiziellen
Web-ZIP mit der SHA-256-Prüfsumme seiner GitHub-Release-Metadaten.

## DeckCraft

Das offizielle [Web-Paket 0.8.0](https://github.com/storytold/deckcraft/releases/tag/v0.8.0)
stürzt beim Start mit `std::process::id: no pids on this platform` ab. Das tritt
sowohl bei der Beispielpräsentation als auch mit `?blank` und mit WebGL auf.
Deshalb wird ausschließlich dann, wenn 0.8.0 das neueste Release ist, das
[offizielle Web-Paket 0.7.0](https://github.com/storytold/deckcraft/releases/tag/v0.7.0)
verwendet. Spätere Upstream-Releases werden wieder ohne diese Ausnahme geprüft.
Die vorhandenen Startprüfungen werden nicht abgeschwächt.

## LightCraft

Das offizielle [Web-Paket 0.9.1](https://github.com/storytold/lightcraft/releases/tag/v0.9.1)
fordert `lightcraft_zh_hans.otf` an, enthält diese Datei aber nicht. Die Paketierung
legt die unveränderte Noto-Sans-CJK-SC-Schrift und ihre SIL-Open-Font-Lizenz bei.
Quelle ist der im [Release-Workflow dieser Version](https://github.com/storytold/lightcraft/blob/v0.9.1/.github/workflows/release.yml)
festgelegte `craft-fonts-ref`-Commit `3d9ab3a132ed0eff457e424226a435a901da30d3`.
Größe und SHA-256 beider Dateien werden vor dem Einpacken geprüft. Die genauen
Quellen und Prüfsummen stehen im Image unter `/licenses/FONT-SOURCES.json`.
Diese Ergänzung gilt nur für 0.9.1, nicht automatisch für künftige Versionen.
