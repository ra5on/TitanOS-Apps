#!/usr/bin/env python3
"""Discover and package official, checksum-pinned Storytold web releases."""
import argparse, hashlib, io, json, os, re, shutil, stat, subprocess, urllib.request, zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
APPS = {
 'photocraft': ('PhotoCraft', 'photos', 'Bilder bearbeiten', 'Edit images'),
 'pdfcraft': ('PdfCraft', 'productivity', 'PDFs bearbeiten', 'Edit PDFs'),
 'filmcraft': ('FilmCraft', 'media', 'Videos bearbeiten', 'Edit videos'),
 'vectorcraft': ('VectorCraft', 'productivity', 'Vektorgrafiken bearbeiten', 'Edit vector graphics'),
 'lightcraft': ('LightCraft', 'photos', 'Fotos entwickeln', 'Develop photos'),
 'designcraft': ('DesignCraft', 'productivity', 'Seiten und Layouts gestalten', 'Design pages and layouts'),
 'effectcraft': ('EffectCraft', 'media', 'Animationen und Effekte gestalten', 'Create motion graphics and effects'),
 'figcraft': ('FigCraft', 'productivity', 'Oberflächen und Prototypen gestalten', 'Design interfaces and prototypes'),
 'wordcraft': ('WordCraft', 'productivity', 'Textdokumente bearbeiten', 'Edit text documents'),
 'gridcraft': ('GridCraft', 'productivity', 'Tabellen bearbeiten', 'Edit spreadsheets'),
 'deckcraft': ('DeckCraft', 'productivity', 'Präsentationen gestalten', 'Create presentations'),
 'cadcraft': ('CADCraft', 'productivity', 'Technische Zeichnungen erstellen', 'Create technical drawings'),
 'soundcraft': ('SoundCraft', 'media', 'Audio aufnehmen und bearbeiten', 'Record and edit audio'),
 'solidcraft': ('SolidCraft', 'productivity', '3D-CAD-Modelle erstellen und bearbeiten', 'Create and edit 3D CAD models'),
}
# Apps that are not published by storytold. Their GHCR images are not public,
# so they are built here from the release's web archive like the others.
OWNERS = {'solidcraft': 'tangency-labs'}
ICONS = {'solidcraft': 'assets/icons/app/linux/exports/hicolor/128x128/apps/ai.storyteller.solidcraft.png'}
TIPS = {'solidcraft': ('''
      Web-Version von SolidCraft (Tangency Labs). Entwürfe werden im Speicher des
      jeweiligen Browsers abgelegt, nicht auf dem NAS. Beim Zugriff von einem anderen
      Gerät ist HTTPS über einen Reverse-Proxy zum Speichern erforderlich; die öffentliche
      URL kann in TitanOS eingetragen werden. Der lokale HTTP-Link allein reicht
      dafür nicht aus. Wichtige Entwürfe zusätzlich als Datei exportieren, bevor
      Browserdaten gelöscht oder Browser, Gerät oder Webadresse gewechselt werden.
      NAS-Freigaben am PC einbinden und beim Öffnen/Exportieren im Dateidialog wählen.
      Kein Dokumentenordner und keine NAS-GPU-Durchreichung erforderlich.
      Anleitung: https://docs.solidcraft.io/guide/getting-started.html''', '''
      SolidCraft web version (Tangency Labs). Designs are stored in each visitor's
      browser, not on the NAS. Access from another device requires an HTTPS reverse proxy
      to save designs; enter its public URL in TitanOS. The local HTTP link alone
      is not sufficient. Export important designs to files before clearing browser
      data or changing browsers, devices or the web address. Mount NAS shares on
      your computer and select them in the file picker when opening/exporting.
      No document directory or NAS GPU passthrough is required.
      Guide: https://docs.solidcraft.io/guide/getting-started.html''')}

def owner(app):
 return OWNERS.get(app, 'storytold')

def api(path):
 return json.loads(subprocess.check_output(['gh', 'api', path], text=True))

def latest(app):
 release = api(f'repos/{owner(app)}/{app}/releases/latest')
 # DeckCraft 0.8.0 panics at std::process::id in WASM, including ?blank.
 # Keep the tested 0.7.0 only while 0.8.0 is latest; later releases are tested normally.
 if app == 'deckcraft' and release['tag_name'] == 'v0.8.0':
  release = api(f'repos/storytold/{app}/releases/tags/v0.7.0')
 tag = release['tag_name']
 if release['draft'] or release['prerelease'] or not re.fullmatch(r'v?\d+\.\d+\.\d+', tag):
  raise ValueError(f'Not a stable release: {tag}')
 assets = [a for a in release['assets'] if re.fullmatch(re.escape(app) + r'-web-[0-9.]+\.zip', a['name'])]
 if len(assets) != 1: raise ValueError(f'{app}: missing or ambiguous web archive')
 asset = assets[0]
 digest = asset.get('digest') or ''
 if not re.fullmatch(r'sha256:[a-f0-9]{64}', digest): raise ValueError('Missing upstream asset SHA-256')
 if not asset['browser_download_url'].startswith(f'https://github.com/{owner(app)}/{app}/releases/download/'):
  raise ValueError('Unexpected asset origin')
 return {'tag':tag, 'url':asset['browser_download_url'], 'sha256':digest[7:], 'size':asset['size']}

def download(url, maximum=160*1024*1024):
 with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'TitanOS-Apps'}), timeout=120) as response:
  data = response.read(maximum+1)
 if len(data)>maximum: raise ValueError('Download exceeds size limit')
 return data

def unpack(data, destination):
 with zipfile.ZipFile(io.BytesIO(data)) as archive:
  entries = archive.infolist()
  if sum(e.file_size for e in entries)>512*1024*1024: raise ValueError('Unpacked archive too large')
  for e in entries:
   p=PurePosixPath(e.filename)
   if p.is_absolute() or '..' in p.parts or '\\' in e.filename or stat.S_ISLNK(e.external_attr >> 16):
    raise ValueError('Unsafe archive member')
  indexes=[e for e in entries if PurePosixPath(e.filename).name=='index.html']
  if len(indexes)!=1: raise ValueError('Expected exactly one web root')
  prefix=PurePosixPath(indexes[0].filename).parent
  for e in entries:
   p=PurePosixPath(e.filename)
   if not p.is_relative_to(prefix) or e.is_dir(): continue
   target=destination/str(p.relative_to(prefix));target.parent.mkdir(parents=True,exist_ok=True)
   target.write_bytes(archive.read(e))
 if not list(destination.rglob('*.wasm')): raise ValueError('Missing WebAssembly')

def supplement_web_assets(app, record, site):
 # Upstream 0.9.1 requests this external font but omits it from its web ZIP.
 # The commit is craft-fonts-ref in lightcraft/v0.9.1/.github/workflows/release.yml.
 if app != 'lightcraft' or record['tag'] != 'v0.9.1': return
 base='https://raw.githubusercontent.com/storytold/craft-fonts/3d9ab3a132ed0eff457e424226a435a901da30d3/fonts/noto-sans-cjk-sc/'
 assets=[
  ('NotoSansCJKsc-Regular.otf','lightcraft_zh_hans.otf',16437364,'2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b'),
  ('OFL.txt','licenses/OFL-NotoSansCJKsc.txt',4301,'6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2'),
 ]
 sources=[]
 for name,target,size,digest in assets:
  data=download(base+name, size)
  if len(data)!=size or hashlib.sha256(data).hexdigest()!=digest: raise ValueError('Supplemental font checksum/size mismatch')
  (site/target).write_bytes(data)
  sources.append({'url':base+name,'sha256':digest,'size':size,'file':target})
 (site/'licenses'/'FONT-SOURCES.json').write_text(json.dumps(sources,indent=2)+'\n')

def prepare(app, record, destination):
 data=download(record['url'])
 if len(data)!=record['size'] or hashlib.sha256(data).hexdigest()!=record['sha256']:
  raise ValueError('Upstream web archive checksum/size mismatch')
 destination.mkdir(parents=True,exist_ok=True)
 unpack(data,destination/'site')
 licenses=destination/'site'/'licenses';licenses.mkdir(parents=True,exist_ok=True)
 # Original notices from the exact release, not from the moving default branch.
 tree=api(f'repos/{owner(app)}/{app}/git/trees/{record["tag"]}')
 notices=[e['path'] for e in tree['tree'] if e['type']=='blob' and re.match(r'^(LICENSE|NOTICE|ATTRIBUTION)([.-]|$)',e['path'],re.I)]
 if not any(p.startswith('LICENSE') for p in notices): raise ValueError('Missing license')
 for name in notices:
  (licenses/name).write_bytes(download(f'https://raw.githubusercontent.com/{owner(app)}/{app}/{record["tag"]}/{name}', 2*1024*1024))
 (licenses/'SOURCE.json').write_text(json.dumps({'repository':f'https://github.com/{owner(app)}/{app}',**record},indent=2)+'\n')
 supplement_web_assets(app,record,destination/'site')
 shutil.copy(ROOT/'packaging/Dockerfile',destination/'Dockerfile')
 shutil.copy(ROOT/'packaging/nginx.conf',destination/'nginx.conf')

def catalog(app,record):
 title,category,de,en=APPS[app];folder=ROOT/app;folder.mkdir(exist_ok=True)
 port=8090+list(APPS).index(app)
 icon_path=ICONS.get(app, f'assets/app-icon/hicolor/128x128/apps/ai.storyteller.{app}.png')
 icon=f'https://raw.githubusercontent.com/{owner(app)}/{app}/{record["tag"]}/{icon_path}'
 tips_de,tips_en=TIPS.get(app,('''
      Web-Version von Storytold; Funktionsumfang kann von der Desktop-Version abweichen.
      Dateien über Öffnen/Exportieren im Browser bearbeiten. NAS-Freigaben am PC einbinden,
      um sie im Dateidialog auszuwählen. Ein Docker-Pfad allein ermöglicht keinen direkten
      Zugriff auf NAS-Dokumente. Es wird kein Dokumentenordner eingebunden.
      Für WebGPU, Zwischenablage und weitere Browserfunktionen HTTPS über einen
      Reverse-Proxy verwenden; die öffentliche URL kann in TitanOS eingetragen werden.
      Vor dem Schließen exportieren; die Speicherung hängt von App und Browser ab.''','''
      Storytold web version; features may differ from the desktop application.
      Open/export files using your browser. Mount an NAS share on your computer to
      select it in the file picker. A Docker path alone does not give browser apps
      access to NAS documents. No document directory is mounted.
      Use an HTTPS reverse proxy for WebGPU, clipboard and other browser features;
      enter its public URL in TitanOS. Export before closing; persistence depends
      on the application and browser.'''))
 compose=f'''# Automatically updated only after the image passes its checks.
x-titanos:
  name: {title}
  main: {app}
  category: {category}
  icon: "{icon}"
  description:
    de: "{de} im Browser. Verarbeitung auf deinem Endgerät."
    en: "{en} in your browser. Processing runs on your device."
  tips:
    de: >-{tips_de}
    en: >-{tips_en}
  ports:
    "8080":
      label: Web UI
      webui: true
services:
  {app}:
    image: ghcr.io/ra5on/titanos-{app}:latest
    restart: unless-stopped
    labels:
      titanos.webui: "http://[host]:{port}"
    ports:
      - "{port}:8080"
    read_only: true
    tmpfs:
      - /tmp:size=32m,mode=1777
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    logging:
      driver: json-file
      options: {{max-size: "10m", max-file: "3"}}
'''
 (folder/'compose.yaml').write_text(compose)
 (folder/'release.json').write_text(json.dumps(record,indent=2)+'\n')

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['discover','prepare','catalog']);parser.add_argument('--app',choices=APPS);parser.add_argument('--record');parser.add_argument('--out',default='image-context');args=parser.parse_args()
 if args.mode=='discover':
  matrix=[]
  for app in APPS:
   try:
    record=latest(app);saved=ROOT/app/'release.json'
    if os.environ.get('GITHUB_EVENT_NAME') in ('pull_request', 'push', 'workflow_dispatch') or not saved.exists() or json.loads(saved.read_text())!=record:matrix.append({'app':app,'record':json.dumps(record)})
   except Exception as error: print(f'{app}: {error}',file=__import__('sys').stderr);raise
  print(json.dumps({'include':matrix}))
 else:
  record=json.loads(args.record) if args.record else latest(args.app)
  if args.mode=='prepare':prepare(args.app,record,Path(args.out))
  else:catalog(args.app,record)
