import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const component = (type, name, short = name) => ({types:[type],long_name:name,short_name:short});
const address = (postcode = true, country = 'ZA') => ({
  formatted_address:'52 Corlett Drive, Johannesburg, South Africa',
  types:['street_address'],
  address_components:[component('street_number','52'),component('route','Corlett Drive'),component('locality','Johannesburg'),component('administrative_area_level_1','Gauteng'),component('country','South Africa', country),...(postcode ? [component('postal_code','2196')] : [])],
});
function resolver({predictions = true, details = address(), geocode = address()} = {}) {
  const requests = [];
  const module = {exports:{}};
  const source = ts.transpileModule(readFileSync(new URL('../src/components/ui/AddressAutocomplete.tsx', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const google = {maps:{places:{PlacesServiceStatus:{OK:'OK'},
    AutocompleteService: class {getPlacePredictions(query, callback) {requests.push(query);callback(Array.isArray(predictions) ? predictions : predictions ? [{place_id:'match'}] : [],'OK');}},
    PlacesService: class {getDetails(query, callback) {requests.push(query);callback(typeof details === 'function' ? details(query.placeId) : details,'OK');}},
  }, Geocoder: class {geocode(query, callback) {requests.push(query);callback(geocode ? [geocode] : [],'OK');}}}};
  vm.runInNewContext(source, {module,exports:module.exports,require:()=>({}),setTimeout,clearTimeout,google,document:{createElement:()=>({})}});
  return {resolve:module.exports.resolveRegistryAddress,requests};
}
test('registry address automatically selects a Places result and fills city/state/postcode', async () => {
  const {resolve,requests} = resolver();
  const result = await resolve('52 CORLETT DR, JOHANNESBURG, JOHANNESBURG, ZA, ZA', 'ZA');
  assert.equal(requests[0].input,'52 CORLETT DR, JOHANNESBURG, ZA');
  assert.equal(requests[0].componentRestrictions.country,'ZA');
  assert.equal(result.city,'Johannesburg');
  assert.equal(result.state,'Gauteng');
  assert.equal(result.zip_code,'2196');
  assert.equal(result.building_number,'52');
  assert.equal(requests.length,2);
});
test('missing postcode is enriched by geocoding the same selected place', async () => {
  const {resolve,requests} = resolver({details:address(false)});
  const result = await resolve('52 Corlett Drive, Johannesburg','ZA');
  assert.equal(result.zip_code,'2196');
  assert.equal(requests[2].placeId,'match');
});
test('no prediction falls back to country-scoped geocoding without user selection', async () => {
  const {resolve,requests} = resolver({predictions:false});
  const result = await resolve('52 Corlett Drive, Johannesburg','ZA');
  assert.equal(result.zip_code,'2196');
  assert.equal(requests.at(-1).componentRestrictions.country,'ZA');
});
test('wrong-country and partial geocodes do not populate invented address values', async () => {
  const wrong = resolver({details:address(true,'US'),geocode:address(true,'US')});
  assert.equal(await wrong.resolve('52 Corlett Drive','ZA'),null);
  const partial = resolver({predictions:false,geocode:{...address(),partial_match:true}});
  assert.equal(await partial.resolve('52 Corlett Drive','ZA'),null);
});

 test('automatic selection skips an unsuitable first suggestion and resolves the matching street address', async () => {
  const {resolve,requests} = resolver({predictions:[{place_id:'city'},{place_id:'street'}], details:id => id === 'city' ? {formatted_address:'Johannesburg',address_components:[component('locality','Johannesburg'),component('country','South Africa','ZA')]} : address()});
  const result = await resolve('52 Corlett Drive, Johannesburg, ZA','ZA');
  assert.equal(result.city,'Johannesburg');
  assert.equal(result.zip_code,'2196');
  assert.equal(requests[2].placeId,'street');
 });
 test('a different house number is not silently selected', async () => {
  const other = address();
  other.address_components[0] = component('street_number','54');
  const {resolve} = resolver({details:other,geocode:null});
  assert.equal(await resolve('52 Corlett Drive, Johannesburg','ZA'),null);
 });
