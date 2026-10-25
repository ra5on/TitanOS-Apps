#!/usr/bin/env python3
"""Read registry metadata only: no image layers, daemon or NAS access needed."""
import argparse
import concurrent.futures
import datetime
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request

ACCEPT = ', '.join(['application/vnd.oci.image.index.v1+json', 'application/vnd.docker.distribution.manifest.list.v2+json', 'application/vnd.oci.image.manifest.v1+json', 'application/vnd.docker.distribution.manifest.v2+json'])

def probe(image):
    name, tag = image.rsplit(':', 1)
    parts = name.split('/')
    registry = parts.pop(0) if '.' in parts[0] or ':' in parts[0] else 'docker.io'
    repository = '/'.join(parts)
    if registry == 'docker.io' and '/' not in repository:
        repository = 'library/' + repository
    host = 'registry-1.docker.io' if registry == 'docker.io' else registry
    url = f'https://{host}/v2/{repository}/manifests/{tag}'
    headers = {'Accept': ACCEPT, 'User-Agent': 'TitanOS-Apps-catalog-validation'}
    for attempt in range(3):
        try:
            try:
                response = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30)
            except urllib.error.HTTPError as error:
                if error.code != 401:
                    raise
                attrs = dict(re.findall(r'(\w+)="([^"]*)"', error.headers.get('WWW-Authenticate', '')))
                if not attrs.get('realm', '').startswith('https://'):
                    raise ValueError('Unsupported registry authentication challenge')
                token_url = attrs['realm'] + '?' + urllib.parse.urlencode({key: attrs[key] for key in ['service', 'scope'] if key in attrs})
                with urllib.request.urlopen(token_url, timeout=30) as token_response:
                    data = json.load(token_response)
                headers['Authorization'] = 'Bearer ' + (data.get('token') or data['access_token'])
                response = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30)
            with response:
                manifest = json.load(response)
                platforms = [item.get('platform', {}) for item in manifest.get('manifests', [])]
                amd64 = any(item.get('os') == 'linux' and item.get('architecture') == 'amd64' for item in platforms)
                if not platforms and 'config' in manifest:
                    request = urllib.request.Request(f'https://{host}/v2/{repository}/blobs/{manifest["config"]["digest"]}', headers=headers)
                    with urllib.request.urlopen(request, timeout=30) as config_response:
                        config = json.load(config_response)
                    amd64 = config.get('os') == 'linux' and config.get('architecture') == 'amd64'
                return {'image': image, 'status': response.status, 'digest': response.headers.get('Docker-Content-Digest'), 'linuxAmd64': amd64}
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(5 * (attempt + 1))
                continue
            return {'image': image, 'status': error.code, 'error': error.reason}
        except Exception as error:
            return {'image': image, 'status': 'error', 'error': str(error)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('images', nargs='*', help='Explicit references; otherwise check every catalog service')
    args = parser.parse_args()
    entries = []
    if args.images:
        entries = [{'image': image} for image in args.images]
    else:
        root = Path(__file__).resolve().parents[1]
        for file in sorted(root.glob('*/compose.yaml')):
            for image in re.findall(r'^\s+image:\s*[\"\']?([^\s\"\']+)', file.read_text(), re.M):
                if '$' in image or '@' in image:
                    raise ValueError(f'{file}: expected a directly editable image tag')
                entries.append({'app': file.parent.name, 'image': image})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        checks = list(pool.map(probe, sorted({entry['image'] for entry in entries})))
    by_image = {check['image']: check for check in checks}
    report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'services': len(entries), 'uniqueImages': len(checks), 'checks': checks}
    if args.output:
        args.output.write_text(json.dumps(report, indent=2) + '\n')
    for check in checks:
        print(json.dumps(check), flush=True)
    failed = [check for check in checks if check.get('status') != 200 or not check.get('linuxAmd64')]
    print(f'Checked {len(entries)} services / {len(checks)} distinct images; {len(failed)} unavailable or unverified.')
    return bool(failed)

if __name__ == '__main__':
    raise SystemExit(main())
