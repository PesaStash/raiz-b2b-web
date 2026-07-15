# GTM dataLayer event schema (Raiz B2B Web)

Source of truth for Custom Event triggers in GTM. All events use snake_case names and push to `window.dataLayer`.

## Helper

- App pushes via `pushDataLayerEvent()` in `src/utils/analytics/dataLayer.ts`
- Monetary events clear `{ ecommerce: null }` before the payload
- Dedupe uses sessionStorage keyed by event + transaction/invoice id
- Never includes PII (email, phone, name, account numbers)

## Events

| Event | Key parameters |
|---|---|
| `sign_up` | `method`, `user_id`, `user_type` |
| `login` | `method`, `user_id` |
| `user_data` | `user_id`, `user_type`, `account_status`, `kyc_status`, `preferred_currency`, `days_since_signup` |
| `kyc_status_update` | `kyc_step`, `kyc_status`, `user_type` |
| `topup_completed` | `transaction_id`, `value`, `currency`, `funding_method` |
| `send_completed` | `transaction_id`, `value`, `currency`, `recipient_type` |
| `request_completed` | `request_id`, `value`, `currency` |
| `swap_completed` | `transaction_id`, `value`, `currency`, `from_currency`, `to_currency`, `amount_out?` |
| `bill_payment_completed` | `transaction_id`, `value`, `currency`, `bill_category?` |
| `invoice_created` | `invoice_id`, `value`, `currency`, `status` |
| `invoice_paid` | `invoice_id`, `value`, `currency`, `status` |
| `customer_added` | `user_id`, `customer_count?` |
| `transaction_failed` | `transaction_type`, `failure_reason`, `value?`, `currency?` |
| `first_transaction_completed` | `transaction_type`, `value`, `currency`, `days_since_signup?` |
| `profile_completed` | `completion_percent`, `user_type` |
| `support_request_created` | `ticket_category?`, `ticket_id?` |
| `report_viewed` | `report_type?` |
| `api_key_generated` | `key_environment` (`live` \| `test`) |
| `logout` | `user_id?`, `session_duration_seconds?` |

## Notes for marketing

1. Fire GTM Custom Event triggers on the `event` name above.
2. Always pair `value` + `currency` (ISO 4217) on monetary hits.
3. For swaps: map GA4 Value/Currency to `value`/`currency` (from side); register `from_currency` / `to_currency` as custom dimensions.
4. Bank-transfer / Zelle top-ups are **not** client-confirmed — do not expect `topup_completed` for those (Stripe card top-ups only).
5. Card request/activate events are not instrumented (feature not live in this app).
6. Verify in GTM Preview on staging before publishing production tags.
