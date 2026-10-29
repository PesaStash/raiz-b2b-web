import test from 'node:test';
import assert from 'node:assert/strict';
import {basicDetailsComplete,accountChoiceRoute,readAccountChoice,saveAccountChoice} from '../src/lib/onboarding.ts';
const user=status=>({business_account:{business_verifications:[{verification_status:status}]}});
test('only submitted or completed basic verification unlocks account choice',()=>{
 for(const status of ['pending','kyc_tier_1','completed']) assert.equal(basicDetailsComplete(user(status)),true);
 for(const status of ['not_started','failed',undefined]) assert.equal(basicDetailsComplete(user(status)),false);
 assert.equal(basicDetailsComplete(undefined),false);
});
test('NGN uses Didit while USD and both enter the full USD flow',()=>{
 assert.equal(accountChoiceRoute('NGN'),'/onboarding/ngn');
 assert.equal(accountChoiceRoute('USD'),'/onboarding/usd');
 assert.equal(accountChoiceRoute('BOTH'),'/onboarding/usd');
});
test('account preference is tenant scoped and tolerates blocked storage',()=>{
 const store=new Map();globalThis.window={};globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
 try {
 saveAccountChoice('a','BOTH');saveAccountChoice('b','NGN');
 assert.equal(readAccountChoice('a'),'BOTH');assert.equal(readAccountChoice('b'),'NGN');assert.equal(readAccountChoice('c'),null);
 store.set('raiz-account-choice:a','unexpected');assert.equal(readAccountChoice('a'),null);
 globalThis.localStorage.getItem=()=>{throw new Error('blocked')};assert.equal(readAccountChoice('b'),null);
 globalThis.localStorage.setItem=()=>{throw new Error('blocked')};assert.doesNotThrow(()=>saveAccountChoice('b','USD'));
 } finally {delete globalThis.window;delete globalThis.localStorage;}
});
