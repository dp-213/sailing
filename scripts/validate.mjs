import fs from 'fs';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ajv = new Ajv({allErrors: true, strict: false});
addFormats(ajv);
function loadJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function loadYAML(file){return yaml.load(fs.readFileSync(file,'utf8'));}

let ok=true;
function check(schemaFile, data, name){
  const schema=loadJSON(schemaFile);
  const validate=ajv.compile(schema);
  const valid=validate(data);
  if(!valid){
    console.error('Validation failed for', name, validate.errors);
    ok=false;
  }
}

const trip=loadYAML('content/trip/trip.yaml');
check('schemas/trip.schema.json',trip,'trip.yaml');

const crew=loadYAML('content/crew/crew.yaml');
check('schemas/crew.schema.json',crew,'crew.yaml');

const boat=loadYAML('content/boat/boat.yaml');
check('schemas/boat.schema.json',boat,'boat.yaml');

const gallery=loadYAML('content/gallery/gallery.yaml');
check('schemas/gallery.schema.json',gallery,'gallery.yaml');

const places=loadJSON('content/map/places.json');
check('schemas/places.schema.json',places,'places.json');
const placeIds=new Set(places.map(p=>p.id));

for (const day of trip.days){
  const file=`content/itinerary/${String(day).padStart(2,'0')}-tag${day}.md`;
  if(!fs.existsSync(file)){
    console.warn('Missing itinerary file', file);
    continue;
  }
  const {data}=matter.read(file);
  check('schemas/itinerary.schema.json',data,`itinerary day ${day}`);
  const ids=[data.from_place_id,data.to_place_id,...(data.stops_place_ids||[])];
  ids.forEach(id=>{if(!placeIds.has(id)){console.error('Unknown place_id',id,'in',file);ok=false;}});
}

if(!ok){
  process.exit(1);
}
