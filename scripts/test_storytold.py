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
if __name__=='__main__':unittest.main()

class SolidCraft(unittest.TestCase):
 def test_official_release_origin(self):
  release={'tag_name':'v0.16.2','draft':False,'prerelease':False,'assets':[{'name':'solidcraft-web-0.16.2.zip','digest':'sha256:'+'a'*64,'size':10,'browser_download_url':'https://github.com/tangency-labs/solidcraft/releases/download/v0.16.2/solidcraft-web-0.16.2.zip'}]}
  with patch.object(module,'api',return_value=release) as api:
   record=module.latest('solidcraft')
   api.assert_called_once_with('repos/tangency-labs/solidcraft/releases/latest')
   self.assertEqual(record['tag'],'v0.16.2')
  release['assets'][0]['browser_download_url']='https://example.org/web.zip'
  with patch.object(module,'api',return_value=release), self.assertRaises(ValueError): module.latest('solidcraft')
 def test_catalog_preserves_storage_guidance_and_port(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d); (root/'solidcraft').mkdir()
   original=(module.ROOT/'solidcraft/compose.yaml').read_text()
   (root/'solidcraft/compose.yaml').write_text(original)
   with patch.object(module,'ROOT',root): module.catalog('solidcraft',{'tag':'v0.16.2'})
   result=(root/'solidcraft/compose.yaml').read_text()
   self.assertIn('ghcr.io/ra5on/titanos-solidcraft:latest',result)
   self.assertNotIn('image: ghcr.io/tangency-labs/',result)
   self.assertIn('8103:8080',result)
   self.assertIn('HTTPS',result)
   self.assertIn('nicht auf dem NAS',result)
