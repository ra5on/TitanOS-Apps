import importlib.util,io, tempfile, unittest, zipfile
from unittest.mock import patch
from pathlib import Path
spec=importlib.util.spec_from_file_location('storytold',Path(__file__).with_name('storytold.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Archives(unittest.TestCase):
 def archive(self,files):
  data=io.BytesIO()
  with zipfile.ZipFile(data,'w') as z:
   for name,value in files.items():z.writestr(name,value)
  return data.getvalue()
 def test_webroot(self):
  with tempfile.TemporaryDirectory() as d:
   module.unpack(self.archive({'app/index.html':'test','app/engine.wasm':b'\x00asm'}),Path(d))
   self.assertTrue((Path(d)/'engine.wasm').exists())
 def test_escape(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(ValueError):module.unpack(self.archive({'app/index.html':'test','../escape':'bad'}),Path(d))
 def test_missing_wasm(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(ValueError):module.unpack(self.archive({'index.html':'test'}),Path(d))
class Catalog(unittest.TestCase):
 def test_existing_ports_remain_stable(self):
  self.assertEqual(list(module.APPS)[:8], ['photocraft','pdfcraft','filmcraft','vectorcraft','lightcraft','designcraft','effectcraft','figcraft'])
 def test_all_released_craft_web_apps_are_discovered(self):
  self.assertEqual(set(module.APPS), {'photocraft','pdfcraft','filmcraft','vectorcraft','lightcraft','designcraft','effectcraft','figcraft','wordcraft','gridcraft','deckcraft','cadcraft','soundcraft','solidcraft'})
 def test_solidcraft_keeps_its_port_and_comes_from_tangency_labs(self):
  self.assertEqual(8090+list(module.APPS).index('solidcraft'), 8103)
  self.assertEqual(module.owner('solidcraft'), 'tangency-labs')
  self.assertEqual(module.owner('cadcraft'), 'storytold')
 def test_ports_avoid_host_network_apps_and_stay_stable(self):
  ports={app:module.host_port(app) for app in module.APPS}
  self.assertEqual(len(set(ports.values())),len(ports))
  self.assertFalse(set(ports.values())&module.taken_ports())
  self.assertEqual((ports['designcraft'],ports['figcraft']),(8195,8197))
  for app,port in ports.items():
   if app not in ('designcraft','figcraft','effectcraft'):self.assertEqual(port,8090+list(module.APPS).index(app))
  # Every catalog app on the host network has its fixed ports reserved.
  repo=Path(__file__).resolve().parents[1]
  for compose in repo.glob('*/compose.yaml'):
   text=compose.read_text()
   if 'network_mode: host' in text:
    for port in __import__('re').findall(r'titanos\.webui:\s*"?http://\[host\]:(\d+)',text):self.assertIn(int(port),module.HOST_NETWORK_PORTS,compose)
 def test_catalog_default_ports_do_not_meet(self):
  # Two apps of the catalog never share a default host port. DNS must be on
  # 53, so the DNS filters are the one exception.
  repo=Path(__file__).resolve().parents[1]
  owners={}
  for compose in sorted(repo.glob('*/compose.yaml')):
   for port in set(__import__('re').findall(r'^\s+- "?(\d+):',compose.read_text(),__import__('re').M)):
    owners.setdefault(int(port),[]).append(compose.parent.name)
  clashes={port:apps for port,apps in owners.items() if len(apps)>1 and port!=53}
  self.assertEqual(clashes,{})
 def test_relocated_catalogs_match_the_generator(self):
  repo=Path(__file__).resolve().parents[1]
  for app in ('designcraft','figcraft'):
   record=__import__('json').loads((repo/app/'release.json').read_text())
   with tempfile.TemporaryDirectory() as d, patch.object(module,'ROOT',Path(d)):
    module.catalog(app,record)
    self.assertEqual((Path(d)/app/'compose.yaml').read_text(),(repo/app/'compose.yaml').read_text())
 def test_icons_json_matches_every_compose_icon(self):
  repo=Path(__file__).resolve().parents[1]
  with tempfile.TemporaryDirectory() as d:
   for compose in repo.glob('*/compose.yaml'):
    (Path(d)/compose.parent.name).mkdir();(Path(d)/compose.parent.name/'compose.yaml').write_text(compose.read_text())
   module.sync_icons(Path(d))
   self.assertEqual((Path(d)/'icons.json').read_text(),(repo/'icons.json').read_text())
   self.assertEqual(len(__import__('json').loads((repo/'icons.json').read_text())),len(list(repo.glob('*/compose.yaml'))))
 def test_storytold_catalog_is_unchanged(self):
  repo=Path(__file__).resolve().parents[1]
  record=__import__('json').loads((repo/'cadcraft'/'release.json').read_text())
  with tempfile.TemporaryDirectory() as d, patch.object(module,'ROOT',Path(d)):
   module.catalog('cadcraft',record)
   expected=(repo/'cadcraft'/'compose.yaml').read_text()
   self.assertEqual((Path(d)/'cadcraft'/'compose.yaml').read_text(),expected)
   self.assertNotIn('${',expected)
   self.assertIn('image: ghcr.io/ra5on/titanos-cadcraft:latest',expected)
   self.assertFalse((Path(d)/'cadcraft'/'.env.example').exists())
class UpstreamRegressions(unittest.TestCase):
 def release(self,tag):
  return {'tag_name':tag,'draft':False,'prerelease':False,'assets':[{'name':'deckcraft-web-'+tag[1:]+'.zip','digest':'sha256:'+'a'*64,'size':10,'browser_download_url':'https://github.com/storytold/deckcraft/releases/download/'+tag+'/web.zip'}]}
 def test_broken_deckcraft_release_uses_previous_version(self):
  with patch.object(module,'api',side_effect=[self.release('v0.8.0'),self.release('v0.7.0')]) as api:
   self.assertEqual(module.latest('deckcraft')['tag'],'v0.7.0')
   self.assertEqual(api.call_args.args[0],'repos/storytold/deckcraft/releases/tags/v0.7.0')
 def test_future_deckcraft_release_is_not_pinned(self):
  with patch.object(module,'api',return_value=self.release('v0.9.0')) as api:
   self.assertEqual(module.latest('deckcraft')['tag'],'v0.9.0')
   api.assert_called_once()
 def test_changed_font_is_rejected(self):
  with tempfile.TemporaryDirectory() as d, patch.object(module,'download',return_value=b'bad'):
   with self.assertRaises(ValueError):module.supplement_web_assets('lightcraft',{'tag':'v0.9.1'},Path(d))
 def test_future_lightcraft_uses_its_own_archive(self):
  with patch.object(module,'download') as download:
   module.supplement_web_assets('lightcraft',{'tag':'v0.10.0'},Path('/unused'))
   download.assert_not_called()
 def test_photocraft_snippets_reach_app_bundle(self):
  with tempfile.TemporaryDirectory() as d, patch.object(module,'download') as download:
   site=Path(d);(site/'snippets'/'eframe-x').mkdir(parents=True);(site/'app').mkdir()
   (site/'snippets'/'eframe-x'/'inline0.js').write_text('export {}')
   module.supplement_web_assets('photocraft',{'tag':'v0.17.0'},site)
   self.assertEqual((site/'app'/'snippets'/'eframe-x'/'inline0.js').read_text(),'export {}')
   self.assertTrue((site/'snippets'/'eframe-x'/'inline0.js').exists())
   download.assert_not_called()
 def test_later_photocraft_keeps_snippets_next_to_app_bundle(self):
  # 0.18.0 has the same app/ layout; the fix follows the layout, not the tag.
  for tag in ('v0.18.0','v0.19.0'):
   with tempfile.TemporaryDirectory() as d:
    site=Path(d);(site/'snippets'/'eframe-x').mkdir(parents=True);(site/'app').mkdir()
    (site/'snippets'/'eframe-x'/'inline0.js').write_text('export {}')
    module.supplement_web_assets('photocraft',{'tag':tag},site)
    self.assertTrue((site/'app'/'snippets'/'eframe-x'/'inline0.js').exists())
 def test_photocraft_without_app_folder_is_untouched(self):
  with tempfile.TemporaryDirectory() as d:
   site=Path(d);(site/'snippets').mkdir()
   module.supplement_web_assets('photocraft',{'tag':'v0.16.0'},site)
   self.assertEqual(sorted(p.name for p in site.iterdir()),['snippets'])
 def test_effectcraft_gets_default_startup_config(self):
  with tempfile.TemporaryDirectory() as d:
   site=Path(d)
   module.supplement_web_assets('effectcraft',{'tag':'v0.19.0'},site)
   self.assertEqual(__import__('json').loads((site/'effectcraft-config.json').read_text()),{'startup':'last'})
   (site/'effectcraft-config.json').write_text('{"startup":"demo"}')
   module.supplement_web_assets('effectcraft',{'tag':'v0.19.0'},site)
   self.assertEqual((site/'effectcraft-config.json').read_text(),'{"startup":"demo"}')
if __name__=='__main__':unittest.main()
