import test from 'node:test';
import assert from 'node:assert/strict';
import { inquiryRequest, inquiryErrors, matchesInquiry } from '../src/lib/companyInquiry.ts';
import { ownershipDisplay, registryOwnership, personPatch } from '../src/lib/usd-kyb/model.ts';
const country = (code, subdivisions = []) => ({ country_code: code, requires_subdivision: subdivisions.length > 0, subdivisions, required_fields: ['registration_number', 'consent'], fields: [{ name: 'registration_number', type: 'string', required: true, min_length: 4, max_length: 24 }] });
test('foreign inquiry preserves punctuation and omits stale Nigerian fields', () => {
  assert.deepEqual(inquiryRequest(country('US', [{code:'US-TX'}]), { registration_number:'12/345', jurisdiction_code:'US-TX', registration_type:'BN', registration_name:'Old name' }, true), {country_code:'US', registration_number:'12/345', jurisdiction_code:'US-TX', consent:true});
});
test('Canadian federal registry is explicit and cross-country selections are invalid', () => {
  const ca = country('CA', [{code:'CA-FD'}]);
  assert.ok(inquiryErrors(ca, {registration_number:'1234'}, true).length);
  assert.ok(inquiryErrors(ca, {registration_number:'1234', jurisdiction_code:'US-TX'}, true).length);
  assert.deepEqual(inquiryErrors(ca, {registration_number:'1234', jurisdiction_code:'CA-FD'}, true), []);
});
test('consent is explicit and Nigerian identifiers retain letters and hyphens', () => {
  const ng = country('NG');
  assert.ok(inquiryErrors(ng, {registration_number:'RC12-AB'}, false).length);
  assert.deepEqual(inquiryErrors(ng, {registration_number:'RC12-AB'}, true), []);
  assert.equal(inquiryRequest(ng, {registration_number:'RC12-AB', registration_name:'  '}, true).registration_name, undefined);
});
test('recovery only accepts the matching country, number, jurisdiction and name refinement', () => {
  const req = {country_code:'US', registration_number:'12/345', jurisdiction_code:'US-TX', consent:true};
  assert.equal(matchesInquiry({...req}, req), true);
  assert.equal(matchesInquiry({...req, jurisdiction_code:'US-NY'}, req), false);
  assert.equal(matchesInquiry({...req, country_code:'NG'}, req), false);
  assert.equal(matchesInquiry({country_code:'NG', registration_number:'RC1234', registration_type:'RC', lookup_registration_name:'Other'}, {country_code:'NG', registration_number:'1234', registration_type:'RC', registration_name:'Name'}), false);
});
test('fractional ownership stays exact, unavailable stays unavailable, and metadata is not patched', () => {
  assert.equal(ownershipDisplay({calculated_ownership_percentage:'0.1', ownership_percentage:null}), '0.1%');
  assert.equal(ownershipDisplay({registry_information:{calculated_ownership_percentage:'99.9'}}), '99.9%');
  assert.equal(registryOwnership({calculated_ownership_percentage:null}), 'Unavailable');
  assert.deepEqual(personPatch({person_key:'stable', calculated_ownership_percentage:'0.1', registry_information:{shares_count:'10000'}}), {person_key:'stable'});
});

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function prefillHelpers(env = 'production', storage) {
  const module = { exports: {} };
  const output = ts.transpileModule(readFileSync(new URL('../src/lib/companyLookup.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, ...(storage ? { window: {}, localStorage: storage } : {}), require: () => ({isProductionDeployment: v => v === 'production'}), process:{env:{NEXT_PUBLIC_APP_ENV:env}} });
  return module.exports;
}
test('saved manual fields win over lookup and Places, while missing address leaves are filled', () => {
  const { buildLookupPrefill } = prefillHelpers();
  const result = {lookup:{legal_name:'Registry name', registered_address:{street_line_1:'Registry road'}}};
  const bundle = {prefilled_draft:{business_profile:{business_legal_name:'My edited name',email:'saved@example.com'}, registered_address:{street_line_1:'My edited road',city:'My city',subdivision:'My state'}}};
  const next = buildLookupPrefill(result, '12/345', 'US', {street:'Google road',city:'Google city',state:'Google state',zip_code:'12345'}, bundle);
  assert.equal(next.business_name, 'My edited name');
  assert.equal(next.street, 'My edited road');
  assert.equal(next.city, 'My city');
  assert.equal(next.zip_code, '12345');
  assert.equal(next.lookup, undefined);
});

const lookupStorage = () => {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
};
const confirmedLookup = {
  registration_number: 'RC1234567', country_code: 'NG', business_name: 'Rejected Registry Company',
  street: 'Registry Street', city: 'Registry City', state: 'Registry State', zip_code: '123456',
  resolved: true, confirmed_at: '2026-11-12T10:00:00Z',
};
test('explicit manual form input never falls back to a stored or in-memory lookup', () => {
  const { selectLookupPrefill } = prefillHelpers();
  assert.equal(selectLookupPrefill(false, null, confirmedLookup), null);
  assert.equal(selectLookupPrefill(true, confirmedLookup, confirmedLookup), null);
  assert.equal(selectLookupPrefill(false, undefined, confirmedLookup), confirmedLookup);
  assert.equal(selectLookupPrefill(false, confirmedLookup, null), confirmedLookup);
});
test('manual entry suppresses old lookup data after module reload and sign-in', () => {
  const storage = lookupStorage();
  let helpers = prefillHelpers('production', storage);
  helpers.saveLookupPrefill('business-a', confirmedLookup);
  assert.equal(helpers.readLookupPrefill('business-a').business_name, confirmedLookup.business_name);
  helpers.enterBusinessManually('business-a');
  assert.equal(helpers.readLookupPrefill('business-a'), null);
  // A restored stale cache must not undo an explicit manual-entry decision.
  storage.setItem('raiz-company-lookup:business-a', JSON.stringify(confirmedLookup));
  helpers = prefillHelpers('production', storage);
  assert.equal(helpers.isManualBusinessEntry('business-a'), true);
  assert.equal(helpers.readLookupPrefill('business-a'), null);
  assert.equal(helpers.isManualBusinessEntry('business-b'), false);
});

test('a rejected inquiry cannot restore a previously cached matching prefill', () => {
  const storage = lookupStorage();
  const helpers = prefillHelpers('production', storage);
  helpers.saveLookupPrefill('business-a', confirmedLookup);
  helpers.readLookupPrefill('business-a');
  helpers.saveLookupDecision('business-a', { country_code: 'NG', registration_number: 'RC1234567' }, false);
  assert.equal(helpers.readLookupPrefill('business-a'), null);
});

test('only explicit confirmation restores prefill after manual entry, without changing another business', () => {
  const storage = lookupStorage();
  const helpers = prefillHelpers('production', storage);
  helpers.saveLookupPrefill('business-b', { ...confirmedLookup, business_name: 'Other Business' });
  helpers.enterBusinessManually('business-a');
  helpers.saveLookupDecision('business-a', { country_code: 'NG', registration_number: 'RC1234567' }, true);
  helpers.saveLookupPrefill('business-a', confirmedLookup);
  assert.equal(helpers.isManualBusinessEntry('business-a'), false);
  assert.equal(helpers.readLookupPrefill('business-a').business_name, confirmedLookup.business_name);
  assert.equal(helpers.readLookupPrefill('business-b').business_name, 'Other Business');
  helpers.clearLookupPrefill('business-a');
  assert.equal(helpers.readLookupPrefill('business-a'), null);
});
test('only the known fake address is replaced outside production', () => {
  const fake = {street_line_1:'1st floor,sum house,fake street',country:'ng'};
  assert.match(prefillHelpers().lookupAddressForForm(fake), /fake street/);
  assert.match(prefillHelpers('development').lookupAddressForForm(fake), /13 Thorbon Avenue/);
  assert.equal(prefillHelpers('development').lookupAddressForForm('42 Real Street'), '42 Real Street');
});

import { registryBusinessPrefill, registryPersonPrefill, normalizeDraft, mergeDraft } from '../src/lib/usd-kyb/model.ts';
const zaLookup = {
  country_code: 'ZA', registration_number: '201100000023', legal_name: 'Example CC',
  business_description: 'Manufacturing toys', phone: '27110000000',
  company_type: 'Close Corporation', business_type: null, vat_number: '000000234325675',
  registered_address: {street_line_1: '52 Example Drive, Johannesburg, ZA', country: 'ZA'},
  directors: [{person_key: 'youverify:0', first_name: 'Alex', last_name: 'Example', title: 'Member', email: null,
    is_director: false, has_control: false, has_ownership: false, is_signer: false, ownership_percentage: null,
    payload: {registry_information: {appointedOn: '2022-01-01'}}}],
};
test('South African registry prefills business fields without guessing types or tax identifiers', () => {
  const defaults = registryBusinessPrefill(zaLookup);
  assert.equal(defaults.business_profile.phone, '27110000000');
  assert.equal(defaults.business_profile.business_description, 'Manufacturing toys');
  assert.equal(defaults.registered_address.country, 'ZA');
  assert.equal(defaults.business_profile.business_type, undefined);
  assert.equal(defaults.identifying_information, undefined);
  const draft = mergeDraft(defaults, normalizeDraft({phone: '27119999999', business_profile:{business_legal_name:'Edited company', business_description:'Edited activity'}}));
  assert.equal(draft.business_profile.business_legal_name, 'Edited company');
  assert.equal(draft.business_profile.business_description, 'Edited activity');
  assert.equal(draft.business_profile.phone, '27119999999');
});
test('members prefill names, title and appointment date without inventing roles or private details', () => {
  const person = registryPersonPrefill({person_key:'youverify:0'}, zaLookup);
  assert.equal(person.first_name, 'Alex');
  assert.equal(person.title, 'Member');
  assert.equal(person.relationship_established_at, '2022-01-01');
  for (const role of ['is_director','has_control','has_ownership','is_signer']) assert.equal(person[role], false);
  assert.equal(person.birth_date, undefined);
  assert.equal(person.email, undefined);
  assert.equal(person.residential_address, undefined);
  const saved = registryPersonPrefill({...person, associated_person_id:'stable-id', first_name:'Edited', relationship_established_at:'2023-01-01', is_director:true}, zaLookup);
  assert.equal(saved.first_name,'Edited');
  assert.equal(saved.relationship_established_at,'2023-01-01');
  assert.equal(saved.associated_person_id,'stable-id');
  assert.equal(saved.is_director,true);
  assert.deepEqual(registryPersonPrefill({person_key:'different-person'}, zaLookup), {person_key:'different-person'});
});
test('basic prefill reads root fields alongside sectioned fields and preserves saved address country', () => {
  const next = prefillHelpers().buildLookupPrefill({lookup:zaLookup}, zaLookup.registration_number, 'ZA', null, {prefilled_draft:{email:'root@example.com',business_profile:{business_legal_name:'Saved company'},registered_address:{street_line_1:'Saved street',country:'US',city:'Midland',subdivision:'Texas',postal_code:'79701'}}});
  assert.equal(next.business_name,'Saved company');
  assert.equal(next.business_email,'root@example.com');
  assert.equal(next.country_code,'US');
  assert.equal(next.street,'Saved street');
});
