import importlib.util,io, tempfile, unittest, zipfile
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
if __name__=='__main__':unittest.main()
