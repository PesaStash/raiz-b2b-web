# USD self-service KYB integration

Contract: `B2B Self-Service KYB Frontend Guide.md`, dated 20 October 2026.
Design: B2B-v2, supplied nodes 31994:789 through 32001:2580.

## Routes and behavior

- `/onboarding/usd` renders grouped setup tasks.
- `/onboarding/usd?step=identity|business_details|owners_directors|activity|documents|review` opens a section. All six sections share one editor instance; navigation flushes pending changes.
- `/kyb-person-invitation#token=…` is the preferred public invitation URL. `?token=…` links are also consumed on bootstrap for compatibility, immediately removed using history replacement, and never persisted. Confirm the email template uses this frontend route before release. Query tokens can reach origin access logs before JavaScript runs; fragment links avoid that exposure.

Draft and person edits save after 750 ms, using a serialized queue and acknowledged payload versions. In-flight edits survive save responses. Conflicts stop saving, fetch the current case, and retain unsaved edits until the user chooses whether to discard or explicitly reapply them. Associated-person PATCH bodies contain only editable contract fields, excluding provider and invitation metadata. Arrays replace; person omission does not delete.

Owner/admin writes require an editable server status. Developers read the same sections without mutation controls. Unknown case statuses fail closed. Documents use the dedicated private upload API, a raw PUT with required headers, then metadata registration with the private S3 reference. Document changes re-fetch completion/validation.

Submission flushes saves, validates, requires the declaration, and calls only submit-for-review. Terms acceptance is required by the frontend before submission; mandatory identity blockers can follow operations submission. All editing and invitation mutations lock after submission; only `requires_correction` reopens them.

No new CSS files or style blocks were added. Layout and states use Tailwind and existing controls.

## Design/API gaps intentionally not fabricated

1. **Monthly USD payment ranges — product-approved, backend confirmation pending.** The six approved bands are enabled in a segmented control. Their keys follow the existing annual-revenue naming convention; the contract still omits accepted monthly values. Unknown saved values remain visible and are preserved until explicitly changed.
2. **Current-user identity + phone handoff.** No KYB endpoint starts an authenticated user's identity session, returns their DOB/ID details, or creates a QR/phone handoff. The new flow does not recreate these Figma tasks. Existing NGN verification is retained separately. Contract-supported associated-person invitations are implemented.
3. **Role/contact setup.** There is no separate current-user role/contact task API, contact-approval model, or authority-based payment permission endpoint. Business contact fields and person roles use their documented KYB fields; they do not grant team permissions or payment authority.
4. **Payment-count and international bands.** Figma's `Under 50` payment count and international-only bands have no documented mappings. The UI uses the contract's annual revenue, account purpose, source of funds, risk and monthly USD fields instead.
5. **Document-age warnings.** There is no extracted document date or freshness finding in the documented response. File names are never used to infer dates. Allowed upload types include WebP/HEIC/HEIF, even though Figma only names PDF/JPG/PNG.
6. **Resend during review.** Figma includes resend on a submitted case, but the contract does not establish a post-submission write exception. The UI locks invitation mutations with the case and directs users to support during review.
7. **Formation/entity mapping.** No country selector or fabricated mapping from registry company type to Bridge business type is added. Country support for lookup is Nigeria only; business types come from the business form-guide endpoint.
8. **Ownership attestation.** The guide names an attestation-or-document requirement but specifies no writable attestation field. The UI supports documented ownership document purposes instead of inventing an attestation payload key.
9. **Account availability and support actions.** KYB completion links to the existing dashboard with actual wallet data. The frontend does not create sample USD/EUR/GBP/NGN/USDT/USDC accounts, assert an approval SLA, grant team access, schedule calls, or simulate live chat.

The backend contract permits deferring terms, but product policy now requires them before frontend submission. The hosted Bridge terms flow is now available on Check and submit. No admin endpoint or direct provider API is imported by the new flow.

## Before release

- Deploy the additive backend migration and feature endpoints, then compare deployed OpenAPI to the guide.
- Confirm the backend accepts the product-approved monthly USD range keys.
- Confirm reference endpoint response shapes and private PUT CORS/required headers against the deployed service.
- Confirm the invitation email URL and provider session URL behavior.
- Verify owner/admin/developer sessions, stale tabs, lookup entitlement, resend/revoke/expiry, pending Didit sessions without URLs, private uploads, corrections and locked review against the deployed backend.

Local checks cover serial request ordering, retained partial/unknown draft data, role and status boundaries, submission blockers, reference options, private upload limits, and person payload filtering. Isolated browser fixtures exercise the production UI without live requests; these do not replace deployed backend acceptance testing.

## Updated shared account setup

New accounts enter `/onboarding` after their first authenticated dashboard visit. Signup still requires login because its OTP response does not establish an authenticated session. The shared guide links to `/onboarding/business`, which submits the existing basic-verification payload, waits for profile refresh, then opens `/onboarding/accounts`. No Bridge terms step sits between basic verification and account selection.

- **NGN** opens `/onboarding/ngn`: existing combined Didit CAC/UBO session, resumable statuses, polling, and an explicit create-account action only after the backend's `can_create_ngn_account` check. Phone handoff encodes the returned session URL locally as a QR code; no new provider endpoint.
- **USD** and **Both** open `/onboarding/usd`, beginning at About the business. Shared setup is marked complete; the old unsupported standalone role/contact and identity steps are removed from this guide.
- Account choice is a tenant-scoped browser preference, not a backend request or approval. Reloading the dashboard resumes that choice. Basic-verification and Nigerian-business gates also apply to direct URLs. The USD case remains server-backed.

### Contract gap: both accounts

The product owner confirmed that successful USD KYB approval provisions USD and NGN accounts automatically. The submitted page therefore has no separate NGN setup action. Provisioning remains the backend's responsibility; the frontend displays returned wallet data. NGN-only onboarding still uses its existing Didit flow.

Monthly payment bands now use the product-approved six ranges. Their keys follow the existing revenue convention (`0_9999`, `10000_49999`, `50000_99999`, `100000_499999`, `500000_999999`, `1000000_plus`); backend acceptance still needs confirmation. Both monthly payments and annual revenue use accessible segmented radio controls, with no default selection and no changes to existing annual-revenue keys.


## Emailed person-verification route

Email links at `/kyb/person-verification?token=…` render the same public verification screen as `/kyb-person-invitation`. Both paths are public and excluded from Google Tag Manager initialization. The email path renders directly rather than redirecting with the token; the client captures the token in memory, removes it from the URL, and calls the public invitation APIs with JSON request bodies. Both routes set `no-referrer` and `noindex`. A real invitation was inspected successfully on localhost; starting the provider identity session was deliberately left to the invited person. Deploy this route alias before expecting the existing Vercel email links to work.

## S3 browser upload CORS

A read-only preflight check against `raiz-document-upload` returned HTTP 403 with `CORSResponse: CORS is not enabled for this bucket.` This prevents the browser's PUT before file data can be sent. The frontend already sends raw file bytes, the presigned method, and every `required_headers` value without business authentication cookies.

A scoped AWS CLI configuration is provided in `docs/aws/raiz-document-upload-cors.json`. It allows PUT from localhost:3000 and the current Vercel dev preview, with the three signed request headers. Add the actual production origin when deploying there. Apply using an authorized AWS identity:

```sh
aws s3api put-bucket-cors --bucket raiz-document-upload --cors-configuration file://docs/aws/raiz-document-upload-cors.json --region eu-west-1
```

For the S3 console, open the bucket's Permissions → Cross-origin resource sharing (CORS), and paste the array inside `CORSRules` (the console expects an array rather than the CLI wrapper). If other CORS rules are added meanwhile, merge with them rather than replacing them. CORS does not make the bucket public or grant object access; uploads still require valid presigned credentials. Keep the bucket private.

Verify with a preflight request (no document or signed URL needed):

```sh
curl -i -X OPTIONS 'https://raiz-document-upload.s3.amazonaws.com/' \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: PUT' \
  -H 'Access-Control-Request-Headers: cache-control,content-disposition,content-type'
```

The response should allow the requesting origin, PUT, and those headers. Retry via the frontend afterward so it obtains a fresh signed URL. The CORS configuration has been prepared, not applied to AWS.


## Account terms in USD KYB

The review page offers Review and accept terms before the independent accuracy declaration. Submit for review stays disabled until a signed agreement is present and the separate accuracy declaration is checked. The submit handler also revalidates and re-fetches the case to verify the agreement before posting. Only identity verification may follow later. The submitted-status page has no terms action or terms refresh control because acceptance is required before submission.

The card flushes draft edits, obtains the hosted URL through the existing terms API, and waits for an acceptance message from that iframe. Acceptance is persisted with the existing terms-save endpoint and confirmed with its read endpoint. The case is refreshed before showing Terms accepted. On an editable case only, a confirmed returned agreement can also be saved through the documented business_profile.signed_agreement_id field using the normal versioned autosave. Locked cases never receive this PATCH. If their refreshed case does not expose the agreement, the card shows an unresolved synchronization message and a refresh/support action rather than claiming success.

No live agreement was accepted during implementation. The submitted page is focused on review status, with the submitted-details disclosure temporarily commented out at the product owner's request.

Terms-before-submission is currently enforced by the frontend. The backend contract still permits deferred terms; enforce the same policy server-side if submissions outside this UI must also be blocked.
