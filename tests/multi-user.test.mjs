import test from "node:test";
import assert from "node:assert/strict";
import {
  accountAccess,
  canMakeRequest,
  canRequestScope,
  isProductionDeployment,
  isPublicPath,
} from "../src/lib/permissions.ts";
import {
  teamSchema,
  invitationDetailsSchema,
  inviteSchema,
  isInvitationExpired,
} from "../src/lib/team.ts";
import { invitationErrorState } from "../src/lib/apiError.ts";
const profile = (role) => ({ role, active: true });
test("team ownership, business writes, and developer tools are independent", () => {
  for (const role of ["owner", "admin", "developer"]) {
    const p = profile(role),
      a = accountAccess(p);
    assert.equal(a.canManageTeam, role === "owner");
    assert.equal(a.canWriteBusiness, role !== "developer");
    assert.equal(
      canMakeRequest(p, "GET", "/business/account_user/team/"),
      role === "owner",
    );
    assert.equal(
      canMakeRequest(p, "PATCH", "/b2b/developers/settings/payouts/ngn"),
      role !== "developer",
    );
    assert.equal(canMakeRequest(p, "POST", "/b2b/developers/keys"), true);
    assert.equal(canMakeRequest(p, "PUT", "/b2b/developers/webhooks/id"), true);
    assert.equal(canMakeRequest(p, "GET", "/business/transactions/"), true);
  }
  assert.equal(accountAccess({ role: "owner", active: 1 }).canManageTeam, true);
  for (const p of [
    null,
    {},
    { role: "owner" },
    { role: "owner", active: false },
    { role: "owner", active: 0 },
  ]) {
    assert.equal(accountAccess(p).canWriteBusiness, false);
    assert.equal(canMakeRequest(p, "POST", "/b2b/developers/keys"), false);
  }
});
test("developer financial and profile writes fail closed; password and logs remain available", () => {
  for (const path of [
    "/business/auth/transaction-pin/",
    "/business/wallet/",
    "/business/account_user/me",
    "/business/beneficiaries/",
    "/b2b/gateway/settlement",
  ])
    assert.equal(canMakeRequest(profile("developer"), "PATCH", path), false);
  assert.equal(
    canMakeRequest(
      profile("developer"),
      "PATCH",
      "/business/auth/password/change/",
    ),
    true,
  );
  assert.equal(
    canMakeRequest(profile("developer"), "GET", "/b2b/developers/logs"),
    true,
  );
});
test("production restrictions depend on deployment, not requested key environment", () => {
  for (const environment of [undefined, "production", "unknown"]) {
    assert.equal(isProductionDeployment(environment), true);
    for (const scope of [
      "payments:write",
      "payouts:write",
      "remittance:settlement:write",
    ]) {
      assert.equal(
        canRequestScope(
          "developer",
          scope,
          isProductionDeployment(environment),
        ),
        false,
      );
      assert.equal(canRequestScope("admin", scope, true), true);
      assert.equal(canRequestScope("owner", scope, true), true);
    }
  }
  for (const environment of [
    "development",
    "test",
    "staging",
    "sandbox",
    "preview",
  ])
    assert.equal(
      canRequestScope(
        "developer",
        "payments:write",
        isProductionDeployment(environment),
      ),
      true,
    );
  assert.equal(canRequestScope("developer", "webhooks:write", true), true);
});
const identity = {
  first_name: "Ada",
  last_name: "Okafor",
  email: "ada@example.com",
  role: "admin",
};
test("contract adapters reject malformed records and non-invitable owner role", () => {
  assert.equal(
    inviteSchema.safeParse({ ...identity, role: "owner" }).success,
    false,
  );
  assert.equal(
    teamSchema.safeParse({
      members: [{ ...identity, active: true }],
      pending_invitations: [],
    }).success,
    false,
  );
  const team = teamSchema.parse({
    members: [{ ...identity, member_id: "m1", active: true }],
    pending_invitations: [
      { ...identity, invitation_id: "i1", expires_at: "2030-01-01T00:00:00Z" },
    ],
  });
  assert.equal(team.members[0].id, "m1");
  assert.equal(team.pending_invitations[0].id, "i1");
  const live = teamSchema.parse({
    members: [
      {
        first_name: "Juma",
        last_name: "Jux",
        business_account_id: "fb452255-e966-4201-b51f-b1971775f0fe",
        authentication_id: "fd416daa-6c21-4f0b-9310-0c61fd0d3a9a",
        is_primary: true,
        role: "owner",
        business_account_user_id: "879fc97d-d906-4195-bc8b-33293484bab9",
        selfie_image: null,
        is_verified: true,
        has_transaction_pin: true,
        active: 1,
        effective_permissions: ["business:read", "team:manage"],
        email: "juma@yopmail.com",
      },
    ],
    pending_invitations: [
      {
        business_account_invitation_id: "96c3bc79-c476-464e-971b-6cf5a82b1404",
        email: "lalong2@yopmail.com",
        first_name: "Lala2",
        last_name: "Long2",
        role: "developer",
        expires_at: "2026-10-02T06:07:17.451057",
        accepted_at: null,
        revoked_at: null,
        active: 1,
        created_at: "2026-10-01T06:07:17.451831",
      },
    ],
  });
  assert.equal(live.members[0].id, "879fc97d-d906-4195-bc8b-33293484bab9");
  assert.equal(live.members[0].active, true);
  assert.equal(
    live.pending_invitations[0].id,
    "96c3bc79-c476-464e-971b-6cf5a82b1404",
  );
  assert.equal(
    live.pending_invitations[0].sent_at,
    "2026-10-01T06:07:17.451831",
  );
  assert.equal(
    invitationDetailsSchema.parse({
      ...identity,
      business_name: "Acme",
      expires_at: "2030-01-01T00:00:00Z",
    }).business_name,
    "Acme",
  );
  assert.equal(
    invitationDetailsSchema.safeParse({
      ...identity,
      business_name: "Acme",
      expires_at: "bad",
    }).success,
    false,
  );
});
test("expiry boundary and terminal failures distinguish recoverable network failures", () => {
  assert.equal(
    isInvitationExpired(
      { expires_at: "2030-01-01T00:00:00Z" },
      Date.parse("2030-01-01T00:00:00Z"),
    ),
    true,
  );
  assert.equal(invitationErrorState({ status: 410 }), "expired");
  assert.equal(
    invitationErrorState({
      response: { status: 400, data: { code: "invitation_already_used" } },
    }),
    "used",
  );
  assert.equal(invitationErrorState({ status: 404 }), "unavailable");
  assert.equal(invitationErrorState(new Error("Network error")), "error");
  assert.equal(isPublicPath("/accept-invite"), true);
  assert.equal(isPublicPath("/team"), false);
});
