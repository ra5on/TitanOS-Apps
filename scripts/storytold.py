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
}

def api(path):
 return json.loads(subprocess.check_output(['gh', 'api', path], text=True))

def latest(app):
 release = api(f'repos/storytold/{app}/releases/latest')
 tag = release['tag_name']
 if release['draft'] or release['prerelease'] or not re.fullmatch(r'v?\d+\.\d+\.\d+', tag):
  raise ValueError(f'Not a stable release: {tag}')
 assets = [a for a in release['assets'] if re.fullmatch(re.escape(app) + r'-web-[0-9.]+\.zip', a['name'])]
 if len(assets) != 1: raise ValueError(f'{app}: missing or ambiguous web archive')
 asset = assets[0]
 digest = asset.get('digest') or ''
 if not re.fullmatch(r'sha256:[a-f0-9]{64}', digest): raise ValueError('Missing upstream asset SHA-256')
 if not asset['browser_download_url'].startswith(f'https://github.com/storytold/{app}/releases/download/'):
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

def prepare(app, record, destination):
 data=download(record['url'])
 if len(data)!=record['size'] or hashlib.sha256(data).hexdigest()!=record['sha256']:
  raise ValueError('Upstream web archive checksum/size mismatch')
 destination.mkdir(parents=True,exist_ok=True)
 unpack(data,destination/'site')
 licenses=destination/'site'/'licenses';licenses.mkdir(parents=True,exist_ok=True)
 # Original notices from the exact release, not from the moving default branch.
 tree=api(f'repos/storytold/{app}/git/trees/{record["tag"]}')
 notices=[e['path'] for e in tree['tree'] if e['type']=='blob' and re.match(r'^(LICENSE|NOTICE|ATTRIBUTION)([.-]|$)',e['path'],re.I)]
 if not any(p.startswith('LICENSE') for p in notices): raise ValueError('Missing license')
 for name in notices:
  (licenses/name).write_bytes(download(f'https://raw.githubusercontent.com/storytold/{app}/{record["tag"]}/{name}', 2*1024*1024))
 (licenses/'SOURCE.json').write_text(json.dumps({'repository':f'https://github.com/storytold/{app}',**record},indent=2)+'\n')
 shutil.copy(ROOT/'packaging/Dockerfile',destination/'Dockerfile')
 shutil.copy(ROOT/'packaging/nginx.conf',destination/'nginx.conf')

def catalog(app,record):
 title,category,de,en=APPS[app];folder=ROOT/app;folder.mkdir(exist_ok=True)
 port=8090+list(APPS).index(app)
 icon=f'https://raw.githubusercontent.com/storytold/{app}/{record["tag"]}/assets/app-icon/hicolor/128x128/apps/ai.storyteller.{app}.png'
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
    de: >-
      Web-Version von Storytold; Funktionsumfang kann von der Desktop-Version abweichen.
      Dateien über Öffnen/Exportieren im Browser bearbeiten. NAS-Freigaben am PC einbinden,
      um sie im Dateidialog auszuwählen. Ein Docker-Pfad allein ermöglicht keinen direkten
      Zugriff auf NAS-Dokumente. Es wird kein Dokumentenordner eingebunden.
      Für WebGPU, Zwischenablage und weitere Browserfunktionen HTTPS über einen
      Reverse-Proxy verwenden; die öffentliche URL kann in TitanOS eingetragen werden.
      Vor dem Schließen exportieren; die Speicherung hängt von App und Browser ab.
    en: >-
      Storytold web version; features may differ from the desktop application.
      Open/export files using your browser. Mount an NAS share on your computer to
      select it in the file picker. A Docker path alone does not give browser apps
      access to NAS documents. No document directory is mounted.
      Use an HTTPS reverse proxy for WebGPU, clipboard and other browser features;
      enter its public URL in TitanOS. Export before closing; persistence depends
      on the application and browser.
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
    if not saved.exists() or json.loads(saved.read_text())!=record:matrix.append({'app':app,'record':json.dumps(record)})
   except Exception as error: print(f'{app}: {error}',file=__import__('sys').stderr);raise
  print(json.dumps({'include':matrix}))
 else:
  record=json.loads(args.record) if args.record else latest(args.app)
  if args.mode=='prepare':prepare(args.app,record,Path(args.out))
  else:catalog(args.app,record)
