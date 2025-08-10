import fs from 'fs';
import yaml from 'js-yaml';
const gallery=yaml.load(fs.readFileSync('content/gallery/gallery.yaml','utf8'));
let ok=true;
if(gallery && gallery.items){
  for(const item of gallery.items){
    try{
      const res=await fetch(item.url,{method:'HEAD'});
      const len=parseInt(res.headers.get('content-length')||'0');
      if(len>1500000){
        console.error('Image too large', item.url, len);
        ok=false;
      }
    }catch(e){
      console.warn('Image check skipped', item.url, e.message);
    }
  }
}
if(!ok) process.exit(1);
