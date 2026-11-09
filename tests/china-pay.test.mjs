import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { compareDecimalAmounts, usableChinaPayQuote, chinaPayError } from "../src/utils/chinaPayQuote.ts";
const request={channel:"alipay",destination_amount:"23.00",funding_currency:"USD"};
const quote={quote_id:"quote",channel:"alipay",destination_money:{amount:"23.00",currency:"CNY"},funding_money:{amount:"3.23",currency:"USD"},fees:[{code:"fee",label:"Fee",amount:{amount:"0.50",currency:"USD"}}],total_debit:{amount:"3.73",currency:"USD"},rate:{value:"0.1404",base_currency:"CNY",quote_currency:"USD"},expires_at:"2030-01-01T00:00:30Z"};
const now=Date.parse("2030-01-01T00:00:00Z");
test("China Pay validates quote amount, channel, funding currency and expiry",()=>{
 assert.equal(usableChinaPayQuote(quote,request,now),true);
 for(const bad of [{...request,channel:"wechat"},{...request,destination_amount:"24"},{...request,funding_currency:"NGN"}]) assert.equal(usableChinaPayQuote(quote,bad,now),false);
 assert.equal(usableChinaPayQuote(quote,request,Date.parse(quote.expires_at)),false);
 assert.equal(usableChinaPayQuote({...quote,total_debit:{amount:"3.73",currency:"NGN"}},request,now),false);
 assert.equal(usableChinaPayQuote({...quote,expires_at:"invalid"},request,now),false);
 assert.equal(usableChinaPayQuote({...quote,total_debit:{amount:"NaN",currency:"USD"}},request,now),false);
 const ngn={...quote,funding_money:{amount:"4715",currency:"NGN"},total_debit:{amount:"4715",currency:"NGN"},fees:[]};
 assert.equal(usableChinaPayQuote(ngn,{...request,funding_currency:"NGN"},now),true);
});
test("balance comparison preserves fractional and large decimal precision",()=>{
 assert.equal(compareDecimalAmounts("9007199254740993.01","9007199254740993.00"),1);
 assert.equal(compareDecimalAmounts("3.730","3.73"),0);
 assert.equal(compareDecimalAmounts("3.72","3.73"),-1);
 assert.throws(()=>compareDecimalAmounts("NaN","0"));
});
test("structured server error codes are preserved",()=>{
 assert.equal(chinaPayError({response:{status:409,data:{error:{code:"quote_expired",message:"Refresh quote"}}}}).code,"quote_expired");
});
test("China Pay uses v2 funding-aware quotes and idempotent quote-bound sends",async()=>{
 const calls=[]; const module={exports:{}};
 const source=ts.transpileModule(readFileSync(new URL("../src/services/chinaPay.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(source,{module,exports:module.exports,require:name=>{
   if(name==="@/lib/authAxios") return {AuthAxios:{post:async(...args)=>{calls.push(args);return {data:quote};}}};
   if(name==="@/services/transactions") return {
     AlipayWechatAmountQuoteApi:async()=>({channel:"alipay",destination_amount:"23.00",rate:"205",naira_amount:"4715.00"}),
     AlipayWechatSendApi:async payload=>({alipay_wechat_transaction_request_id:"legacy-id",entity_id:"entity",wallet_id:"wallet",beneficiary_id:payload.beneficiary_id,channel:payload.channel,destination_amount:payload.amount,rate:"205",naira_amount:"4715.00",status:"pending",initiated_at:"2030-01-01",liquidated_at:null,transaction_report_id:null,original_ledger_transaction_id:null,reversal_ledger_transaction_id:null,created_at:"2030-01-01",updated_at:"2030-01-01"}),
   };
   return {};
 }});
 await module.exports.QuoteChinaPayApi(request,"quote-key");
 const body={quote_id:"quote",beneficiary_id:"recipient",transaction_pin:"test-pin"};
 await module.exports.SendChinaPayApi(body,"send-key");
 await module.exports.SendChinaPayApi(body,"send-key");
 assert.equal(calls[0][0],"/business/transactions/v2/alipay-wechat/quotes/");
 assert.equal(calls[0][1].funding_currency,"USD");
 assert.equal(calls[0][2].headers["Idempotency-Key"],"quote-key");
 assert.equal(calls[1][0],"/business/transactions/v2/alipay-wechat/send-v2/");
 assert.deepEqual(calls[1][1],body);
 assert.equal(calls[1][2].headers["Idempotency-Key"],calls[2][2].headers["Idempotency-Key"]);
 assert.equal(calls[1][1].amount,undefined);
});

test("China Pay preserves the deployed NGN amount and send APIs",async()=>{
 const module={exports:{}};
 const source=ts.transpileModule(readFileSync(new URL("../src/services/chinaPay.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const legacyCalls=[];
 vm.runInNewContext(source,{module,exports:module.exports,require:name=>{
   if(name==="@/lib/authAxios") return {AuthAxios:{post:async()=>{throw new Error("v2 must not be called for NGN")}}};
   if(name==="@/services/transactions") return {
     AlipayWechatAmountQuoteApi:async input=>{legacyCalls.push(["quote",input]);return {channel:"alipay",destination_amount:"23.00",rate:"205",naira_amount:"4715.00"};},
     AlipayWechatSendApi:async payload=>{legacyCalls.push(["send",payload]);return {alipay_wechat_transaction_request_id:"legacy-id",entity_id:"entity",wallet_id:"wallet",beneficiary_id:payload.beneficiary_id,channel:payload.channel,destination_amount:payload.amount,rate:"205",naira_amount:"4715.00",status:"pending",initiated_at:"2030-01-01",liquidated_at:null,transaction_report_id:null,original_ledger_transaction_id:null,reversal_ledger_transaction_id:null,created_at:"2030-01-01",updated_at:"2030-01-01"};},
   };
   return {};
 }});
 const legacyQuote=await module.exports.QuoteChinaPayApi({...request,funding_currency:"NGN"},"unused");
 assert.equal(legacyQuote.legacy,true);
 assert.equal(legacyQuote.total_debit.amount,"4715.00");
 const result=await module.exports.SendLegacyChinaPayApi({beneficiary_id:"recipient",channel:"alipay",amount:"23.00",transaction_pin:"1234"});
 assert.equal(result.funding_currency,"NGN");
 assert.equal(legacyCalls[0][0],"quote");
 assert.equal(legacyCalls[1][0],"send");
});
