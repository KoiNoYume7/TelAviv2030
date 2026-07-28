# TelAviv Group Finance App — CLAUDE.md

## 0. Document Purpose

This document is the authoritative product, behavioral, security, and architectural specification for the TelAviv Group Finance App.

Any AI coding agent, developer, contributor, or future maintainer working on this project MUST treat this document as the source of truth for product behavior.

The application is a small, private, Switzerland-based group finance application for a real friend group. It is not intended to be a public banking product, commercial fintech platform, social network, or generalized budgeting application.

The application exists to make shared group saving and group purchases transparent, auditable, easy to understand, and difficult to misuse.

The most important design principle is:

> Trust is the foundation, software is the accountability layer.

The software must support the group's trust rather than attempt to replace it.

The application MUST favor a small, understandable, conservative V1 over feature richness.

Do not add functionality merely because it is technically possible.

Do not infer missing group policies.

Do not silently invent governance rules.

If a policy has not been decided by the group, the application should generally leave that policy unimplemented rather than making its own decision.

---

# 1. Project Context

The friend group is called the **TelAvivers** / **TelAviv community**.

The name originates from an old group concept called "TelAviv2030", which originally referred to a long-term plan to travel to Tel Aviv in 2030. The group name and terminology are intentionally kept as part of the group's identity.

The group has a physical shared hangout space which functions like a second living room. The shared funds are intended for group purposes such as:

* upgrading the shared room
* buying shared equipment
* purchasing food/drinks or other group items through an explicitly approved request
* saving for group trips
* saving for future group holidays
* other collectively approved group goals

The group is not a gang, organization, company, or formal hierarchy.

There is no social leader.

One person owns/hosts the physical room and therefore naturally has some practical authority over that physical space, but this does NOT make that person the financial leader or owner of the group's funds.

The three currently responsible builders are:

1. the primary developer/system owner
2. another trusted member approaching legal adulthood
3. the person who originally created the group and hosts the shared room

These people are responsible for building the application and handling its technical infrastructure, but this does NOT grant them additional social or financial authority over the rest of the TelAviver group.

---

# 2. Core Philosophy

The system MUST be built around the following principles.

## 2.1 Trust

The group is heavily trust-based.

The application is not intended to eliminate the need for trust.

Instead, it provides:

* transparency
* identity
* accountability
* immutable history
* voting records
* financial state tracking
* proof storage
* technical auditability

## 2.2 No financial dictatorship

No technical administrator, system owner, server owner, or developer may silently obtain financial authority simply because they control the infrastructure.

Infrastructure control and financial authority are separate concepts.

## 2.3 No hidden financial manipulation

Financial values must not be editable through ordinary application interfaces.

The application MUST maintain an immutable financial/audit history.

Exceptional technical intervention is possible only where explicitly required for recovery or reconciliation, and such intervention MUST itself be audited.

## 2.4 Simplicity

The target users are friends, not finance professionals.

The mobile application should be extremely easy to understand.

The start screen should surface important information immediately.

Do not create unnecessary navigation or complicated financial terminology.

## 2.5 Conservative V1

V1 should intentionally be restrictive.

It is better to tell users:

> "This cannot be done yet."

than to implement an ambiguous financial operation incorrectly.

---

# 3. Terminology

The following terminology is authoritative.

## 3.1 TelAviver

A full/OG member of the community.

A TelAviver may participate in financial governance and group spending.

## 3.2 TelAvivling

A newer/probationary member of the community.

A TelAvivling is still part of the same overall community.

TelAvivlings are NOT socially inferior and are NOT subordinate to TelAvivers.

The distinction exists because the group wants to ensure that people who rarely participate do not immediately receive full access to group-funded benefits.

The distinction is a status/trust distinction, not a hierarchy.

TelAvivling status should be visibly distinct in the UI, potentially through color or badge styling, but MUST NOT be presented as a rank above/below another person.

## 3.3 Retired TelAviver

A former TelAviver whose active membership has ended.

A retired member retains historical records but loses active financial/community permissions.

Retirement does not automatically trigger financial settlement.

Any remaining financial questions are handled by the group outside the application.

## 3.4 Contribution

Money voluntarily provided by an active TelAviver into the group's shared funds.

A contribution is permanently classified as a contribution.

## 3.5 Donation

Money voluntarily provided by a TelAvivling into the group's shared funds.

A donation is permanently classified as a donation.

If a TelAvivling later becomes a TelAviver, historical donations remain donations.

They are NOT retroactively converted into contributions.

## 3.6 Plan

A long-term savings goal.

Examples:

* New TV
* New sound system
* TelAviv 2030 holiday
* Group vacation
* Room upgrade

A Plan does not represent an immediate purchase.

A Plan may have:

* name
* description
* target amount
* target date
* current progress
* status

A Plan does not require an immediate unanimous vote.

## 3.7 Request

An immediate proposed group purchase.

A Request represents an actual intended expenditure which the group can currently afford.

A Request must have sufficient available group funds when created.

A Request goes through the full approval, recipient selection, payout, purchase, and completion lifecycle.

## 3.8 Recipient

The TelAviver who is selected to receive the payout so they can make the approved purchase on behalf of the group.

The recipient does not become the owner of the group's funds merely because they receive a payout.

## 3.9 System Admin

A technical maintenance role.

System Admin is a JOB/RESPONSIBILITY, not a social rank or financial authority.

System Admins may investigate technical issues, inspect relevant financial details, access technical audit facilities, and perform permitted maintenance operations.

System Admins MUST NOT arbitrarily modify financial values.

## 3.10 System Owner

The owner of the technical infrastructure/server.

The System Owner has the maximum technical permissions because the owner controls the physical/virtual infrastructure on which the application operates.

The System Owner does NOT gain ordinary financial authority merely because of infrastructure ownership.

Exceptional owner actions must be logged.

---

# 4. Roles and Access Model

The system has two separate dimensions:

1. Community status
2. Technical access

These MUST NOT be conflated.

## 4.1 Community statuses

Possible community statuses:

```text
TELAVIVER
TELAVIVLING
RETIRED_TELAVIVER
RETIRED_TELAVIVLING
```

## 4.2 Technical roles

Possible technical roles:

```text
MEMBER
SYSTEM_ADMIN
SYSTEM_OWNER
```

The actual permission system should combine these independently.

For example:

```text
TELAVIVER + MEMBER
TELAVIVER + SYSTEM_ADMIN
TELAVIVER + SYSTEM_OWNER
TELAVIVLING + MEMBER
RETIRED_TELAVIVER + MEMBER
```

A System Admin is not automatically a TelAviver.

A TelAviver is not automatically a System Admin.

The System Owner's infrastructure ownership does not make them the group's financial owner.

---

# 5. TelAviver Permissions

Active TelAvivers have full normal financial/community functionality.

They can:

* view relevant group information
* view members
* view contribution information
* view donation information where appropriate
* create Plans
* create Requests
* vote on Requests
* change their votes while voting remains open
* cancel their own Requests
* edit their own Requests
* select themselves as a potential recipient
* participate in recipient selection
* accept/decline a payout when selected
* upload purchase proof
* inspect historical financial activity
* inspect relevant audit/history information available to members
* contribute voluntarily

TelAvivers do NOT receive additional authority merely because they contributed more money.

Money does not equal voting power.

Money does not equal social authority.

Money does not equal administrative authority.

---

# 6. TelAvivling Permissions

TelAvivlings remain part of the overall community but have restricted V1 financial access.

TelAvivlings can:

* authenticate
* access their own account
* view members
* view relevant community information
* make voluntary donations
* view their own donation history
* view relevant donation information
* see contribution/donation recognition information where intentionally exposed

TelAvivlings MUST NOT in V1:

* create spending Requests
* vote on spending Requests
* view the group's purchase history
* view detailed purchase information
* control group spending
* see the live group bank balance
* receive payout authority
* gain financial governance authority

The exact future transition mechanism from TelAvivling to TelAviver is intentionally NOT fully defined in V1.

Do not implement automatic promotion based on contribution amount.

Contribution/donation history may be used by the group as social information when deciding membership outside the application's automated governance.

The application MUST NOT automatically decide that someone deserves TelAviver status because they donated enough money.

---

# 7. Retired Members

When an active TelAviver becomes retired:

* active permissions are revoked
* historical records remain
* historical contributions remain recorded
* historical votes remain recorded
* historical Requests remain recorded
* historical donations remain recorded
* the user's identity remains visible in historical records
* no automatic reimbursement occurs
* no automatic settlement occurs

The group handles any financial settlement personally/outside the application.

When a TelAvivling retires:

* their donation history remains
* they simply lose active access
* no special financial settlement occurs

Retired members may be displayed with a clearly distinct historical status.

---

# 8. System Admin Permissions

System Admin is technical maintenance access.

System Admins should be able to:

* investigate system errors
* inspect detailed financial state
* inspect detailed transaction state
* inspect relevant bank integration state
* inspect audit logs
* inspect reconciliation information
* investigate suspicious/inconsistent states
* access test mode where authorized
* perform permitted technical maintenance
* help diagnose why a financial operation failed

System Admins MUST NOT:

* arbitrarily edit balances
* arbitrarily edit transaction amounts
* alter votes
* silently approve Requests
* silently reject Requests
* delete audit history
* edit historical audit entries
* modify contribution/donation classifications without an auditable correction procedure
* bypass ordinary financial governance merely because they are technical administrators

System Admin access is not social authority.

---

# 9. System Owner Permissions

The System Owner has the maximum technical access.

The System Owner may need to:

* operate the server
* deploy software
* update configuration
* recover infrastructure
* manage system administrators
* perform emergency technical intervention
* access test mode
* inspect deep system state
* resolve unrecoverable synchronization problems
* resolve certain financial state mismatches when the external bank state proves what actually happened
* perform emergency financial recovery actions
* manually resolve stuck payout state when justified

However:

> System Owner is NOT a hidden financial superuser.

The Owner must NOT be able to silently:

* change the group's balance
* fabricate money
* delete financial history
* erase audit history
* alter historical votes
* silently approve a payout
* silently reject a payout
* silently change a contribution into a donation or vice versa

Any exceptional intervention MUST generate an immutable audit record.

---

# 10. Owner Emergency Actions

The System Owner may have emergency controls for situations where the normal application is broken.

Examples:

* freeze new payouts
* freeze financial operations
* disable new Requests
* disable contributions/donations
* manually reconcile a bank state
* resolve a payout stuck because an external bank confirmation was missed
* recover from an integration failure

An emergency freeze SHOULD leave read-only functionality available wherever safely possible.

A financial freeze should not necessarily make the entire application unusable.

The system should distinguish:

```text
Application operational
Financial system operational
Bank integration operational
Reconciliation operational
```

An issue in one subsystem should not automatically destroy unrelated read-only functionality.

---

# 11. Owner Changelog Requirement

Whenever the System Owner performs an exceptional intervention, a changelog/reason field MUST be required.

Example:

```text
Action:
Resolve payout state

Previous state:
PENDING

New state:
SETTLED

Reason:
Bank confirmed transaction settlement but webhook was not received.

Evidence:
Bank transaction reference XXXXX

Performed by:
System Owner

Timestamp:
2026-XX-XXTXX:XX:XXZ
```

The Owner MUST NOT be able to perform exceptional actions without leaving a trace.

The changelog is part of the audit history.

---

# 12. Immutable Audit System

Auditability is a core feature, not an optional logging feature.

The system must log essentially every meaningful state-changing action.

Examples include:

* login/security events where relevant
* member applications
* membership approvals
* membership removals
* status changes
* promotions
* retirement
* access-level changes
* System Admin changes
* System Owner actions
* Request creation
* Request editing
* Request cancellation
* vote creation
* vote changes
* vote withdrawal
* approval
* rejection
* recipient enrollment
* recipient selection
* recipient acceptance
* recipient refusal
* payout submission
* payout status changes
* bank status changes
* bank reconciliation
* proof uploads
* proof deletion if deletion is ever permitted
* completion
* failed transactions
* financial freezes
* emergency interventions
* test-mode actions
* configuration changes
* security-sensitive events

Audit records MUST be append-only.

No normal application user can edit audit records.

No System Admin can edit audit records.

The System Owner cannot delete audit records.

The System Owner cannot rewrite audit history.

If something is wrong, create a new corrective event.

Do not rewrite the old event.

---

# 13. Audit Tamper Resistance

The architecture SHOULD be designed from the beginning to support tamper detection.

Consider:

* append-only event storage
* immutable event IDs
* timestamps
* actor IDs
* event types
* previous-event hashes
* event hashes
* cryptographic signatures where practical
* database-level restrictions
* separate audit storage where appropriate
* backups

A hash-chain or equivalent tamper-evident mechanism should be considered for V1 if feasible.

The goal is:

> If someone modifies historical audit data outside the intended application flow, the system should be able to detect that the history has been altered.

Do not sacrifice core functionality merely to implement an unnecessarily complex cryptographic system in V1, but the data model MUST be designed so stronger tamper evidence can be introduced later without rebuilding the entire financial architecture.

---

# 14. Test Mode

Test Mode is a real-money technical testing environment.

It exists so the developer can verify that real banking integration works.

Test Mode uses:

* the developer's personal real bank account
* real banking integration
* real transactions
* real transaction status

Test Mode is NOT fake money.

Real transactions must be treated as real transactions.

Test Mode must be heavily restricted.

It must not accidentally be accessible as a normal group financial environment.

The application MUST clearly identify Test Mode.

The UI should make it extremely difficult to confuse:

```text
TEST MODE
```

with:

```text
SHOWCASE MODE
```

or:

```text
PRODUCTION MODE
```

Test Mode is intended to test enough real banking functionality to verify:

* account reading
* balance reading where supported
* transaction initiation
* transaction status
* pending state
* successful settlement
* failure state
* reconciliation
* bank integration behavior

Test Mode must never be used to pretend that a real group transaction occurred.

---

# 15. Showcase Mode

Showcase Mode is a simulated financial environment.

It exists to demonstrate and test:

* UI
* authentication
* membership
* Plans
* Requests
* voting
* recipient selection
* payout workflow
* receipts/proof
* audit logs
* permissions
* notifications
* financial state transitions
* failure scenarios
* reconciliation logic

No real money should move in Showcase Mode.

A simulated bank backend/account should be used.

Showcase Mode is intended for demonstrating the application safely.

---

# 16. Production Mode

Production Mode is the eventual real group environment.

It will use:

* real group members
* real group account
* real contributions
* real donations
* real Requests
* real payouts
* real bank integration

Production Mode MUST NOT be treated as a development environment.

No development/test shortcut should be available in Production Mode.

---

# 17. Environment Safety

Environment must be explicit.

Possible environment:

```text
TEST
SHOWCASE
PRODUCTION
```

The environment MUST NOT be switchable by an ordinary user through the normal UI.

Production secrets must never be present in Showcase or Test builds unnecessarily.

Test credentials must never be used in Production.

Showcase transactions must never touch real bank accounts.

The application should make environment identity visible in development/admin contexts.

---

# 18. Authentication

V1 should use Google authentication.

Users should not create arbitrary local accounts.

The user's Google identity is the identity basis for the application.

Membership access should be controlled through the application's membership/allowlist system.

The application should associate:

* Google account identity
* internal user ID
* community status
* technical role
* membership state
* history

A Google account does not automatically become a TelAviver simply by logging in.

Membership must be explicitly approved according to the group's current membership process.

---

# 19. Membership Approval

The exact final governance process for adding/removing members is intentionally still under group discussion.

For V1, do NOT build automatic membership governance beyond the agreed technical requirement.

System Admins may manage the underlying Google-account whitelist/access mechanism.

Do not assume that System Admins automatically have authority to decide social membership unless explicitly configured.

Membership changes must be logged.

The system must preserve historical identity even when access is revoked.

---

# 20. Request Eligibility

Only active TelAvivers can create spending Requests.

A TelAviver may have only:

> **1 active Request at a time.**

This is a spam-prevention mechanism.

A Request is not intended for random small purchases.

There is no “quick expense” system in V1.

Users cannot simply buy something and add it to a shared tab.

Every group-funded purchase must follow the Request process.

---

# 21. Request Cooldown

After creating a Request, the user enters a creation cooldown.

Recommended V1 value:

> 5 minutes

The cooldown exists primarily to prevent spam/trolling.

The cooldown does NOT prevent:

* voting
* changing a vote
* cancelling the Request
* viewing the Request
* participating in recipient selection
* other legitimate actions

The cooldown should not be used as an arbitrary rate limit for unrelated features.

---

# 22. Request Ownership

The person who creates the Request is the Request owner.

The Request owner:

* automatically approves their own Request
* can cancel their Request
* can edit their Request
* is responsible for the accuracy of the Request
* is responsible for the stated amount and description

The Request owner does NOT receive additional voting power.

Their automatic approval counts as one approval.

---

# 23. Request Contents

A V1 Request should contain at minimum:

* Request ID
* creator
* title/name
* description
* exact requested amount
* currency
* creation timestamp
* expiry timestamp
* current status
* current voting state
* audit history

Potentially useful fields:

* linked Plan
* intended merchant/store
* purchase category
* optional notes

Do not overcomplicate the form.

The user should be able to create a Request quickly.

---

# 24. Exact Amount Rule

For V1:

> The approved amount is the exact amount authorized for payout.

If the group approves:

> CHF 80

then the authorized payout is:

> CHF 80

There is no:

* maximum amount
* spending allowance
* “up to” amount
* automatic tolerance
* automatic price adjustment

The application MUST NOT silently change the amount.

---

# 25. Request Amount Responsibility

The requester is responsible for entering the expected purchase price correctly.

Possible real-world causes of mismatch include:

1. requester entered the wrong amount
2. price changed
3. shipping cost changed
4. tax changed
5. availability changed
6. another external condition changed

V1 does not automatically solve these cases.

If the approved amount is no longer correct:

* requester can cancel/edit the Request before locking where permitted
* editing resets the voting process
* a materially different purchase should be handled as a new voting decision

---

# 26. Request Affordability

A Request may only be created if the group currently has sufficient available funds for the exact requested amount.

For example:

```text
Available:
CHF 1,000

Request:
CHF 850

Allowed.
```

But:

```text
Available:
CHF 800

Request:
CHF 850

Not allowed.
```

This prevents the application from creating Requests that cannot currently be funded.

Long-term saving belongs in Plans.

---

# 27. Plans

Plans are long-term goals and are separate from Requests.

A Plan may exist even if the group cannot currently afford the target.

Examples:

```text
New TV
Target: CHF 1,200
Current: CHF 700
Target date: 2028
```

or:

```text
TelAviv 2030
Target: CHF 12,000
Current: CHF 4,000
Target date: 2030
```

Plans are not Requests.

Plans do not reserve money.

Plans do not authorize spending.

Plans do not initiate payouts.

When the group is ready to buy something, a Request can be created for the actual purchase.

---

# 28. Editing Requests

The Request owner can edit their own Request while editing is permitted.

Any material change MUST reset the voting process.

Material changes include:

* amount
* item
* purpose
* description
* important merchant information
* expiry
* other details that materially affect the decision

Minor cosmetic corrections may not need a reset.

When a material edit happens:

```text
Previous voting state
        ↓
Archived as historical revision
        ↓
New Request revision
        ↓
Fresh voting round
```

The old version must remain visible in audit history.

Do not overwrite the previous Request data in a way that destroys the original state.

---

# 29. Cancelling Requests

The Request owner can cancel their own Request while it remains cancellable.

Cancellation must be logged.

A cancelled Request must not continue toward payout.

The historical Request remains visible in history.

Cancellation does not erase its votes or other audit events.

---

# 30. Request Voting

All active TelAvivers participate in Request voting.

The Request owner is automatically approved.

Other active TelAvivers can:

* approve
* reject

Votes can be changed while voting remains open.

The system must record vote changes.

The system must not treat a changed vote as though the original vote never existed.

The audit log should preserve:

```text
Akira approved
Akira rejected
Akira approved
```

as a sequence of events.

---

# 31. No Silent Approval

The system must never infer approval from inactivity.

Not voting does not mean approval.

A Request reaches approval only when all required active TelAvivers have approved.

---

# 32. Rejection

A rejection does not necessarily destroy the Request immediately.

The Request remains open for discussion.

A rejecting member may change their vote later.

The Request can eventually reach unanimous approval if everyone changes their vote to approval.

This is intentional.

The system should not punish discussion.

---

# 33. Request Approval

A Request becomes approved only when:

> Every required active TelAviver has approved.

Once this happens, a cooling-off period begins.

---

# 34. Approval Cooling-Off Period

V1 uses:

> **24 hours**

After unanimous approval is reached, the Request enters a 24-hour cooling-off period.

During this period, eligible voters can reconsider.

If the Request is changed, the voting process resets.

If a required member's status changes, the Request must react according to the membership-change rules.

---

# 35. Early Lock

If everyone approves and no relevant membership/request changes invalidate the decision:

```text
Unanimous approval reached
        ↓
24-hour cooling-off period
        ↓
No cancellation/change
        ↓
Financial decision locks
```

The lock should occur automatically when the 24-hour period expires.

The UI should clearly show:

* approval reached
* time remaining
* lock timestamp

---

# 36. Request State Model

The exact implementation may differ, but the conceptual lifecycle is:

```text
DRAFT
  ↓
PENDING_VOTE
  ↓
APPROVED_COOLDOWN
  ↓
LOCKED
  ↓
RECIPIENT_SELECTION
  ↓
RECIPIENT_ACCEPTANCE
  ↓
PAYOUT_PENDING
  ↓
PAYOUT_SUBMITTED
  ↓
PAYOUT_BANK_PENDING
  ↓
PAYOUT_SETTLED
  ↓
PURCHASE_PENDING_PROOF
  ↓
COMPLETED
```

Possible failure/cancellation branches:

```text
PENDING_VOTE → CANCELLED
PENDING_VOTE → EXPIRED
PENDING_VOTE → EDITED / NEW_REVISION

RECIPIENT_SELECTION → RECIPIENT_SELECTION
RECIPIENT_ACCEPTANCE → RECIPIENT_SELECTION
PAYOUT_SUBMITTED → PAYOUT_FAILED
PAYOUT_BANK_PENDING → PAYOUT_FAILED
PAYOUT_BANK_PENDING → ADMIN_REVIEW
```

Do not collapse these states merely to simplify code.

The financial system needs to know what actually happened.

---

# 37. Recipient Selection

Once a Request is financially locked, recipient selection begins.

The Request creator is automatically eligible.

Any TelAviver who voted in favor of the Request may choose to volunteer.

The system should provide a clear action such as:

> "I can handle this purchase"

Only volunteers become eligible recipients.

No external nomination system is required in V1.

---

# 38. Recipient Eligibility

Eligible recipient:

* active TelAviver
* participated in the approved Request
* explicitly volunteered
* has not been excluded by a relevant system rule

The Request creator is automatically eligible because they own the Request.

Any eligible TelAviver can vote for themselves.

---

# 39. Recipient Selection Voting

The group must reach consensus on exactly one recipient.

The system should not simply select the person with the highest number of votes.

Example:

```text
Simon: 4 votes
Leon: 2 votes
Akira: 1 vote
```

This does NOT automatically make Simon the recipient.

The group must converge on one person.

This preserves the group's unanimous governance principle.

---

# 40. Recipient Selection Time

Recipient selection should NOT require another 24-hour cooling-off period.

The 24-hour period is for deciding whether the group should spend the money.

Recipient selection is operational.

The selection should resolve immediately once everyone agrees.

If the group needs time, the system should provide a short operational window rather than forcing a full 24-hour delay.

A reasonable V1 implementation may use approximately:

> 30–60 minutes

but this should be configurable internally if required.

The exact value is less important than the principle:

> Recipient selection should not be unnecessarily slow.

---

# 41. Recipient Selection Failure

If no recipient is selected:

* do not automatically transfer money
* do not randomly assign someone
* do not automatically cancel the Request

The Request should remain in an:

> Approved — awaiting recipient

state.

The group can attempt recipient selection again.

---

# 42. Random Recipient Selection

Random selection is NOT the default V1 behavior.

Do not automatically choose a random recipient.

If random selection is ever introduced, the result must still be explicitly accepted/rejected by the group.

---

# 43. Recipient Acceptance

Once consensus identifies a recipient, the selected recipient must explicitly accept the payout.

The system must not automatically transfer money merely because they were selected.

The recipient sees:

> You have been selected to receive CHF X for Request Y.

Actions:

```text
Accept
Decline
```

Acceptance is a security and accountability boundary.

---

# 44. Recipient Declines

If the selected recipient declines:

* no payout occurs
* the selection returns to recipient selection
* the group may choose another eligible recipient
* the event is logged

The Request does not automatically fail.

---

# 45. Payout Authorization

The payout must correspond exactly to the approved amount.

If:

```text
Approved:
CHF 900
```

then:

```text
Payout:
CHF 900
```

No automatic adjustment.

---

# 46. Payout State

A payout must distinguish at least:

```text
NOT_STARTED
SUBMITTED
PENDING
SETTLED
FAILED
CANCELLED
REQUIRES_REVIEW
```

Exact naming can vary.

The important principle is that:

> Submitted ≠ settled.

and:

> Pending ≠ failed.

---

# 47. Bank Authority

The external bank is authoritative for actual money movement.

The application database is not proof that money actually moved.

The application may maintain an internal expected state, but it must reconcile against the bank.

Example:

```text
Application:
Payout expected = CHF 900

Bank:
CHF 900 transfer = pending
```

Application state:

```text
PENDING
```

Later:

```text
Bank:
CHF 900 transfer = settled
```

Application state:

```text
SETTLED
```

---

# 48. Bank Pending State

If a bank transfer remains pending:

* do not treat it as failed
* do not initiate duplicate payouts automatically
* do not mark the Request completed
* continue monitoring
* alert System Admins if the pending period exceeds a reasonable threshold

System Admin alerting should not automatically cancel the payout.

---

# 49. Failed Payouts

If a payout fails:

* no purchase should be considered funded
* no completion should occur
* no duplicate transfer should automatically be created without confirmation
* the failure must be logged
* System Admins should be notified when appropriate
* the system should allow investigation and retry/recovery

A transient failure should not immediately destroy the Request.

---

# 50. Critical Financial Failure

If the application cannot confidently determine the financial state:

```text
Expected state ≠ observed bank state
```

the system should enter a safe state.

Examples:

* bank API inconsistency
* missing transaction confirmation
* reconciliation mismatch
* duplicate transaction possibility
* unexpected amount
* unknown payout state

The system should:

* block risky new financial actions where necessary
* notify System Admins
* preserve all evidence
* allow investigation
* avoid guessing

The system must prefer:

> "Unknown — investigation required"

over:

> "Probably fine."

---

# 51. Reconciliation

The application should continuously or periodically compare:

* internal expected financial state
* bank-reported state
* transaction history
* balance where available

Normal delays must not trigger false alarms.

For example:

> A transaction is pending at the bank

is normal.

The system should only raise a critical integrity alert when the observed state exceeds expected normal behavior or cannot be reconciled.

---

# 52. Bank Balance

Where supported, the application may display the bank balance.

However, the UI must clearly distinguish:

```text
Bank-reported balance
```

from:

```text
Application-calculated available balance
```

Bank information may be delayed.

Do not present delayed data as though it were real-time certainty.

If the bank balance cannot safely be considered current, show an appropriate timestamp/state.

TelAvivlings must not see the live group bank balance in V1.

---

# 53. Available Balance

The system should maintain a concept of:

> available funds

which accounts for known committed/pending financial operations where appropriate.

Do not assume:

```text
bank balance = immediately spendable balance
```

if pending payouts or other known obligations exist.

The exact accounting implementation should be carefully designed around actual bank capabilities.

---

# 54. Purchase Proof

A completed purchase requires proof.

Acceptable V1 proof can include:

* photograph of a physical receipt
* screenshot of an online purchase
* screenshot of successful payment/order confirmation
* digital receipt
* PDF receipt
* email receipt screenshot
* equivalent evidence

The system does not need to automatically understand the proof.

---

# 55. Proof Privacy

The system MUST NOT automatically inspect or OCR receipt/proof images in V1.

Do not send proof images to AI services for automatic analysis.

Proof is stored for:

* transparency
* accountability
* dispute resolution
* audit purposes

The group can manually inspect it if necessary.

---

# 56. Proof Completion

Once:

1. payout is confirmed as settled
2. purchase has occurred
3. recipient uploads proof

the Request can be marked:

> COMPLETED

No second unanimous approval is required.

The system assumes the group's trust model.

If somebody does not trust the proof, they can manually inspect it and investigate.

---

# 57. Spending Less Than Approved

V1 does not automatically resolve price differences.

If:

```text
Approved:
CHF 900

Actual:
CHF 847
```

the recipient is expected to return the unused CHF 53 to the group.

This is a trust-based obligation in V1.

The software does not automatically calculate or initiate a refund.

Future versions may support explicit refund/reconciliation workflows.

---

# 58. Spending More Than Approved

If:

```text
Approved:
CHF 900

Actual:
CHF 930
```

the system does not automatically authorize the additional CHF 30.

The additional amount requires a new Request in V1.

The recipient must not treat the additional amount as automatically approved.

---

# 59. Contributions

Contributions are voluntary.

Nobody is required to contribute.

A contribution:

* belongs to the shared financial history
* increases the group's funds when settled
* is permanently classified as a contribution
* does not give additional voting power
* does not give additional authority
* does not give the contributor ownership of decisions

Contribution history may be used for recognition.

---

# 60. Donations

Donations are voluntary.

TelAvivlings may donate.

A donation:

* is tied to the donor account
* remains classified as a donation permanently
* enters the shared funds when settled
* does not give the donor voting authority
* does not grant additional governance power
* remains visible in appropriate history

If the donor later becomes a TelAviver:

> donation remains donation.

---

# 61. No Mandatory Payments

The application MUST NOT create:

* mandatory recurring payments
* payment schedules
* automatic contribution requirements
* debt balances
* "you owe the group" counters

Nobody owes the group money through the V1 system.

If the group personally agrees that someone owes money, that is handled outside the app.

---

# 62. Contributions and Donations Are Not Ownership Shares

The application must not imply:

```text
CHF 500 contributed = 20% ownership
```

or any equivalent concept.

Do not implement ownership percentages.

Do not implement automatic withdrawal rights.

Do not implement automatic reimbursement upon leaving.

Legal treatment of contributions/donations remains a separate matter.

---

# 63. Member Departure

If a TelAviver leaves:

* active access is revoked
* history remains
* contributions remain in historical records
* donations remain in historical records
* group funds remain unchanged
* no automatic payout/refund occurs

The group decides separately whether any money should be returned.

Do not build an automatic settlement algorithm for V1.

---

# 64. Membership Changes During Requests

If an active TelAviver is removed/retired while a Request is active:

* notify the group
* remove that member from the set of active voters

If unanimous approval has already been reached, the Request should proceed toward the 24-hour lock rather than becoming permanently invalid.

If unanimous approval has NOT been reached, the Request continues with the reduced active membership.

Historical votes from the removed member remain in the audit history.

Do not erase their historical participation.

---

# 65. New TelAviver During an Active Request

If a TelAvivling becomes a TelAviver while an existing Request is ongoing, the existing Request participants should be able to decide whether the new member participates in that Request.

Do not automatically insert the new member into every active Request.

The system should support explicitly adding the new TelAviver to the relevant Request where appropriate.

Any change must be logged.

---

# 66. Member Status Visualization

The UI should visibly distinguish:

* TelAviver
* TelAvivling
* Retired

The distinction should be clear but not hierarchical.

Suggested design direction:

```text
TelAviver      → primary/full-member visual identity
TelAvivling    → clearly different secondary color/badge
Retired        → muted/historical styling
```

Do not use wording that implies TelAvivlings are lesser people.

---

# 67. Rewards and Recognition

The application may include lightweight recognition.

Examples:

* contribution count
* donation count
* participation indicators
* badges
* trophies
* "regular contributor"
* similar non-authoritative recognition

Rewards MUST NOT provide:

* extra voting power
* extra spending power
* administrative authority
* financial priority
* special access to shared funds

Recognition is recognition.

Money does not buy power.

---

# 68. Recognition and Membership

Contribution/donation activity may be considered socially relevant when the group discusses TelAvivling → TelAviver progression.

However:

> The application must not automatically promote someone because they contributed/donated enough.

The group decides membership.

The app may provide data.

It must not replace the group's judgment.

---

# 69. Notifications

Notifications should be useful and minimal.

Do not spam users.

Important events should generate notifications, such as:

* Request created
* Request needs vote
* Request rejected
* Request approved
* 24-hour lock period started
* Request locked
* recipient selection required
* recipient selected
* payout acceptance required
* payout submitted
* payout pending
* payout settled
* payout failed
* proof required
* Request completed
* membership change
* critical financial alert
* System Admin alert where relevant

---

# 70. Home Screen

The home/start page is extremely important.

The user should not have to navigate through multiple pages to discover important pending actions.

The home screen should prominently surface things such as:

```text
Needs your vote
Recipient selection
Payout acceptance
Proof required
Plan progress
Important financial alerts
Recent activity
```

Do not bury urgent actions behind menus.

Avoid unnecessary page switching.

The app should feel like:

> Open → immediately understand what needs your attention.

---

# 71. Security Confirmation

Money-related actions should require explicit confirmation.

For sensitive actions such as:

* voting
* creating a Request
* cancelling a Request
* accepting a payout
* potentially donating/contributing
* other irreversible financial actions

the application should support a second security confirmation.

Biometric authentication should be preferred where available.

If biometrics are unavailable, provide a secure PIN fallback.

Do NOT require biometric/PIN authentication simply to open/read the app.

The purpose is:

> prove that the person intentionally performed a sensitive action.

not:

> lock the entire application behind biometrics.

---

# 72. Request Submission Security

Submitting a new spending Request should require security confirmation.

The user should not be able to accidentally submit a high-value Request with one casual tap.

Recommended flow:

```text
Fill Request
    ↓
Review
    ↓
Confirm details
    ↓
Biometric/PIN confirmation
    ↓
Request created
```

The exact UI can vary.

---

# 73. Voting Security

Votes on financial Requests should also support biometric/PIN confirmation.

Changing a vote should be treated as a meaningful action and should be logged.

Do not make voting impossible to use because of security friction.

Security should be strong but smooth.

---

# 74. No Instant Financial Actions

No financial action should happen silently from a casual tap.

Especially:

* no instant payout
* no automatic recipient acceptance
* no automatic Request approval from inactivity
* no hidden balance changes
* no silent financial state transitions

The user should understand when money is involved.

---

# 75. Financial Ledger Architecture

The financial ledger is a critical component.

It should not merely be a mutable:

```text
balance = 1234.56
```

field that arbitrary application code can modify.

Financial state should be represented through immutable or strongly controlled transactions/events.

The application should be able to reconstruct the financial history from authoritative transaction records.

Any derived balance should be calculable from those records.

If a correction is necessary:

> create a correction event.

Do not overwrite history.

---

# 76. External Bank vs Internal Ledger

The external bank is authoritative for real money movement.

The internal ledger is authoritative for:

* what the application expected
* why money moved
* which Request authorized it
* who approved it
* who received it
* what external transaction corresponds to it
* what proof was attached

These systems must be reconciled.

Neither should silently overwrite the other.

---

# 77. Transaction IDs

Every internal financial transaction should have a stable internal ID.

Where the bank provides a transaction/reference ID, store it separately.

Example:

```text
Internal transaction:
TXN-2026-000184

External bank transaction:
BANK-XXXXX
```

Never use an external bank ID as the only internal identifier.

---

# 78. Financial Corrections

If the system encounters a mismatch:

```text
Internal expected:
CHF 900 settled

Bank:
CHF 900 settled

Webhook:
missing
```

the System Owner may resolve the state if the external evidence is sufficient.

The correction must create an audit event.

Example:

```text
CORRECTION:
Payout marked SETTLED

Reason:
Bank transaction verified manually.

Actor:
System Owner

Evidence:
External transaction ID

Timestamp:
...
```

No correction should erase the previous state.

---

# 79. Test Audits

Test Mode should not pollute the real production audit history.

Test operations should be clearly marked:

```text
TEST_AUDIT
```

and stored in the appropriate test environment.

System Admins/System Owner can use Test Mode to test financial behavior without confusing test actions with actual group history.

Showcase Mode should likewise keep simulated activity isolated from Production.

---

# 80. Receipts and Attachments

Attachments should be associated with a specific Request/payout.

The system should store:

* attachment ID
* Request ID
* uploader
* timestamp
* file type
* size
* storage reference
* checksum/hash if appropriate

The system should not inspect receipt content automatically in V1.

Access to attachments should follow appropriate permissions.

---

# 81. Data Integrity

Critical records should use:

* immutable IDs
* foreign-key relationships
* timestamps
* actor IDs
* explicit state transitions
* database constraints
* transactions/atomic operations where necessary

Do not rely exclusively on frontend validation.

All financial and permission rules must be enforced on the backend.

The frontend is untrusted.

---

# 82. Backend Is Authoritative

The client/mobile application must never be trusted to enforce:

* voting rules
* membership rules
* amount limits
* role permissions
* payout permissions
* environment separation
* financial state transitions

The backend must enforce all of these.

A malicious or modified client must not be able to bypass financial rules.

---

# 83. No Client-Side Financial Authority

Never implement:

```text
if (user.isAdmin) {
    balance = ...
}
```

or equivalent client-authoritative financial logic.

Financial permissions and state transitions must be server-authoritative.

---

# 84. Race Conditions

Financial operations must be designed to handle concurrent actions.

Examples:

* two people vote simultaneously
* someone changes their vote while the timer expires
* recipient selection occurs while membership changes
* payout submission happens while reconciliation runs
* a webhook arrives twice
* a bank transaction is polled and webhooked simultaneously

All financial state transitions must be idempotent where appropriate.

Duplicate bank notifications must not produce duplicate payouts.

---

# 85. Idempotency

Payout initiation must use idempotency protection.

If the same request to initiate a payout is accidentally submitted twice:

> The system must not create two transfers.

The external transaction identifier and internal payout ID should be used to ensure safe retries.

---

# 86. Webhooks / Polling

If the chosen bank integration supports webhooks, use them where appropriate.

Webhooks must not be trusted blindly.

Verify authenticity/signature according to provider requirements.

Polling may be used as a reconciliation fallback.

A missed webhook must not permanently leave the system in an unknown state.

---

# 87. Banking Provider

The exact Swiss banking provider/API is NOT yet finalized.

Do not hard-code assumptions about:

* instant transfers
* pending transaction visibility
* balance freshness
* webhook availability
* transfer cancellation
* transfer reversal
* transaction metadata
* authentication mechanism

The integration layer should abstract provider-specific behavior.

The application should be designed around the actual capabilities of the chosen Swiss provider once researched.

---

# 88. TWINT

TWINT is a desired Swiss payment method, but technical feasibility and API availability must be researched before implementation.

Do not assume that a private application can directly integrate with TWINT in the same way a normal consumer app can.

Do not invent an unofficial integration.

The application should investigate legitimate supported integrations.

If direct TWINT integration is unavailable, the architecture should allow another supported banking/payment mechanism.

---

# 89. Card Payments

A normal card/bank-based mechanism may be used if it is technically and legally appropriate.

The exact card/payment implementation remains to be researched.

Do not store unnecessary card information.

Do not build custom card handling if a trusted payment/banking provider should handle it.

---

# 90. Legal Scope

This application involves real money and is based in Switzerland.

Legal and regulatory questions MUST be researched separately before real production use.

The software specification must NOT pretend that technical design determines legal status.

Questions requiring explicit legal review include:

* whether the arrangement constitutes a shared account, association, partnership, or another structure
* who legally owns/controls the bank account
* whether contributions are gifts/donations
* whether contributions can be reclaimed
* what happens when someone leaves
* tax implications
* payment-service regulations
* banking requirements
* liability
* contractual acknowledgements
* privacy/data protection
* storage of receipts
* retention requirements
* user rights
* age/minor participation
* responsibility for unauthorized transactions

The group should resolve the legal structure before relying on the system for substantial real funds.

---

# 91. User Agreement / Rules Acknowledgement

The application should support versioned acknowledgement of the group's financial rules.

A user may be required to acknowledge:

* how contributions work
* how donations work
* how Requests work
* voting behavior
* recipient responsibilities
* proof requirements
* what happens when someone leaves
* that participation is voluntary
* relevant community rules

Store:

```text
user_id
agreement_version
accepted_at
```

Do not overwrite previous acknowledgements.

Legal validity of such an acknowledgement must be reviewed separately.

---

# 92. No Automatic Legal Interpretation

The software must not label money as:

> “legally owned by the group”

unless the group's actual legal structure establishes this.

The application may call it:

> shared group funds

as a product concept while keeping the legal interpretation separate.

---

# 93. Privacy

The app contains sensitive financial information.

Minimize stored personal data.

Do not collect information merely because it might be useful later.

Financial records should be accessible only to people who need them according to the agreed permissions.

TelAvivlings should not see restricted TelAviver financial information.

Proof attachments should be protected.

Logs should avoid storing secrets.

---

# 94. Secrets

Never store:

* bank credentials
* API secrets
* OAuth client secrets
* encryption keys
* signing keys

in source code.

Use secure environment configuration/secret storage.

Do not commit secrets to Git.

---

# 95. Database Backups

The financial database must be backed up.

Backups should preserve:

* financial records
* audit logs
* membership history
* Request history
* proof references

Backups should be protected against unauthorized access.

The backup strategy should be documented before Production Mode.

---

# 96. Disaster Recovery

The system should have a documented recovery process.

At minimum:

1. restore infrastructure
2. restore database
3. verify audit integrity
4. verify financial ledger
5. reconcile against bank
6. verify pending payouts
7. verify environment
8. resume financial operations only after integrity is confirmed

Do not blindly restore and immediately enable payouts.

---

# 97. Financial Freeze

The application should support an emergency financial freeze.

A freeze may disable:

* new Requests
* payouts
* contributions
* donations

depending on severity.

Existing history should remain readable.

The reason for the freeze must be logged.

The system should display clearly:

> Financial operations temporarily disabled.

---

# 98. Error Handling

Errors should be explicit.

Never silently fail a financial operation.

Bad:

> "Something went wrong."

Better:

> "The bank did not confirm this transfer. No new transfer was created. The transaction is under review."

Users should understand whether money:

* was not submitted
* was submitted
* is pending
* settled
* failed
* requires investigation

---

# 99. No Duplicate Payouts

A Request must never result in two payouts unless the system can prove the first one failed/cancelled and a new payout is explicitly authorized.

This is a critical invariant.

---

# 100. No Negative Surprise

The application should prioritize preventing:

* duplicate transfers
* silent transfers
* unauthorized transfers
* hidden financial changes
* missing audit history
* confusing state
* accidental Requests
* accidental votes
* accidental payouts

over optimizing for speed.

---

# 101. Mobile Application

The primary user experience should be mobile-first.

The group wants an application that is:

* simple
* quick
* visually clear
* not overloaded with financial jargon
* usable by people who dislike complex applications

The mobile app should prioritize:

1. Home
2. Actions requiring attention
3. Plans
4. Requests
5. Group/member information
6. History
7. Profile/settings

Exact navigation can evolve.

---

# 102. UX Principle

A user should not need to understand the backend to understand the app.

Instead of:

> `PAYOUT_STATE = BANK_PENDING_RECONCILIATION`

show:

> **Payment is still processing**
>
> The bank has not confirmed the transfer yet.

The detailed technical state should remain available to System Admins.

---

# 103. User-Facing State vs Technical State

The backend may have detailed states.

The frontend should translate them into understandable language.

For example:

```text
BANK_PENDING
```

→

> Payment processing

```text
REQUIRES_REVIEW
```

→

> Payment needs attention

```text
SETTLED
```

→

> Money sent

```text
PURCHASE_PENDING_PROOF
```

→

> Purchase proof required

Do not expose raw internal enums to normal users.

---

# 104. History

History is important.

Users should be able to inspect:

* contributions
* donations
* Requests
* votes where appropriate
* payouts
* completed purchases
* proof attachments where permitted
* member status history where appropriate

History must be chronological and understandable.

---

# 105. Audit Detail

Normal members should receive appropriate transparency without necessarily receiving every low-level technical audit record.

System Admins should have much deeper audit access.

System Owner has the deepest technical access.

However:

> Nobody gets to edit the audit history.

---

# 106. V1 Explicitly Does NOT Include

Do not implement these unless explicitly re-approved:

* automatic recurring payments
* mandatory contributions
* debt tracking
* personal balances owed to the group
* automatic refunds upon leaving
* ownership percentages
* automatic member promotion
* automatic member removal
* automatic social governance
* automatic random recipient assignment
* automatic price adjustment
* automatic spending tolerance
* quick expenses
* arbitrary purchases outside Requests
* automatic receipt analysis
* AI receipt inspection
* AI financial decision-making
* automatic reimbursement calculations
* complex tax functionality
* public user accounts
* public groups
* invite links
* social media functionality
* marketplace functionality
* credit
* loans
* overdrafts
* crypto
* investment functionality
* unnecessary gamification
* financial advice
* commercial banking functionality

---

# 107. Future Features

Potential future features include:

* direct TWINT integration if legitimately supported
* broader banking integrations
* more sophisticated Plans
* contribution recognition
* badges
* improved recipient selection
* spending reconciliation
* automatic unused-money return workflows
* price-change reapproval
* formal member governance
* improved membership progression
* richer reporting
* better financial analytics
* cryptographically stronger audit infrastructure
* more sophisticated notification controls
* additional payment methods

Future functionality must not weaken V1's core trust model.

---

# 108. Important Invariants

The following invariants MUST hold.

## Financial

1. No payout without a valid Request.
2. No payout without unanimous Request approval.
3. No payout without a selected recipient.
4. No payout without recipient acceptance.
5. Payout amount equals approved amount.
6. No duplicate payout.
7. Bank settlement is required before considering money transferred.
8. No silent balance changes.
9. No automatic extra spending beyond approval.
10. No automatic refund assumptions.

## Governance

11. Money does not grant authority.
12. Technical access does not grant financial authority.
13. TelAvivling is not a subordinate social rank.
14. TelAviver is not a financial ownership title.
15. Request inactivity does not equal approval.
16. Request edits that materially change the decision reset voting.
17. Historical decisions are never erased.

## Audit

18. Every meaningful state change is logged.
19. Audit records are append-only.
20. Audit records cannot be deleted through the app.
21. Exceptional owner intervention is logged.
22. Corrections create new events instead of rewriting history.

## Environment

23. Test Mode cannot accidentally operate as Production.
24. Showcase Mode cannot move real money.
25. Production must never use test credentials.
26. Test actions must be distinguishable from real production history.

---

# 109. Development Rules for AI Coding Agents

AI coding agents MUST follow these rules.

## 109.1 Do not invent product behavior

If the specification does not define something:

* ask before implementing it, or
* create a clearly documented placeholder/abstraction

Do not silently choose financial behavior.

## 109.2 Do not simplify financial state

Never merge states simply because the implementation is easier.

The distinction between:

* submitted
* pending
* settled
* failed
* cancelled
* requires review

is intentional.

## 109.3 Do not bypass the backend

Do not enforce security or financial rules only in the mobile client.

## 109.4 Do not modify historical records

Use append-only events/corrections.

## 109.5 Do not add unnecessary dependencies

Prefer stable, well-supported libraries.

Avoid dependency bloat.

## 109.6 Do not build the whole product at once

V1 is intentionally small.

Build the smallest secure vertical slice first.

---

# 110. Recommended Development Order

The project should be developed in this order.

## Phase 1 — Foundations

* project structure
* environment separation
* database
* authentication
* user model
* role model
* community status model
* audit framework

## Phase 2 — Financial Core

* ledger
* contribution
* donation
* balance calculations
* transaction model
* reconciliation model
* immutable event model

## Phase 3 — Plans

* Plan creation
* target amount
* target date
* progress
* Plan history

## Phase 4 — Requests

* Request creation
* affordability check
* active-request limit
* cooldown
* editing
* cancellation
* voting
* vote changes
* unanimous approval
* 24-hour cooling-off
* lock

## Phase 5 — Recipient Workflow

* volunteer/enlistment
* recipient selection
* consensus
* recipient acceptance
* recipient refusal
* retry selection

## Phase 6 — Banking

First implement the abstraction.

Then implement Test Mode.

Only after Test Mode is verified should the real provider integration become part of Showcase/Production architecture.

## Phase 7 — Proof

* receipt/photo/screenshot upload
* secure storage
* Request completion
* history

## Phase 8 — Mobile UX

* home
* pending actions
* Plans
* Requests
* members
* history
* profile
* security confirmations

## Phase 9 — Hardening

* security audit
* authorization testing
* race-condition testing
* duplicate payout testing
* bank failure testing
* reconciliation testing
* backup testing
* audit integrity testing

---

# 111. V1 Vertical Slice

Before expanding features, the system should demonstrate this complete flow:

```text
Google login
    ↓
Approved TelAviver
    ↓
Create Request
    ↓
Biometric/PIN confirmation
    ↓
Other TelAvivers vote
    ↓
All approve
    ↓
24h cooling-off
    ↓
Request locks
    ↓
Eligible members volunteer
    ↓
Group agrees on one recipient
    ↓
Recipient accepts
    ↓
Payout initiated
    ↓
Bank confirms settlement
    ↓
Recipient makes purchase
    ↓
Recipient uploads proof
    ↓
Request becomes completed
    ↓
Full history/audit available
```

The Showcase environment should support this entire flow without real money.

The Test environment should support enough of the banking portion to verify real bank behavior.

---

# 112. Testing Requirements

Tests must cover both normal behavior and hostile/unexpected behavior.

At minimum test:

### Authentication

* valid Google login
* unauthorized Google account
* revoked member
* retired member
* TelAvivling
* TelAviver
* System Admin
* System Owner

### Requests

* valid Request
* insufficient funds
* duplicate active Request
* cooldown
* cancellation
* edit
* material edit resets voting
* minor edit
* expiry
* concurrent edits

### Voting

* unanimous approval
* rejection
* changing rejection to approval
* changing approval to rejection
* inactive user
* member retirement
* new member joining
* vote race conditions
* timer race conditions

### Recipient

* no volunteers
* one volunteer
* multiple volunteers
* self-selection
* split selection
* consensus
* recipient decline
* recipient acceptance
* recipient timeout

### Payout

* successful payout
* pending payout
* delayed payout
* failed payout
* duplicate payout attempt
* webhook duplication
* webhook loss
* bank mismatch
* manual owner resolution

### Proof

* receipt upload
* screenshot upload
* invalid file
* large file
* unauthorized access
* proof completion

### Audit

Every state-changing operation must generate the expected audit event.

Test that audit records cannot be edited/deleted through normal APIs.

Test tamper detection if implemented.

---

# 113. Security Testing

Security testing must include:

* authorization bypass
* role escalation
* TelAvivling → TelAviver privilege escalation
* System Admin privilege escalation
* System Owner privilege misuse
* direct API manipulation
* modified mobile client
* replay attacks
* duplicate payout requests
* race conditions
* forged webhook
* unauthorized proof access
* unauthorized history access
* database injection
* authentication token abuse
* environment confusion
* production/test credential leakage

---

# 114. Financial Safety Priority

When there is a conflict between:

> convenience

and:

> financial safety

choose financial safety.

When there is a conflict between:

> implementation simplicity

and:

> preserving an auditable state

choose the auditable state.

When there is a conflict between:

> fast development

and:

> preventing duplicate/unauthorized money movement

choose prevention.

---

# 115. Design Principle: Fail Closed

Financial actions should fail closed.

Examples:

If the bank state is unknown:

> do not send another transfer.

If authorization is unclear:

> deny action.

If membership state is inconsistent:

> require review.

If audit integrity fails:

> restrict risky financial actions.

If a payout might already exist:

> do not create another one.

The application should never guess when money is involved.

---

# 116. Design Principle: Explain Every Financial State

At any point, a user should be able to answer:

1. What is happening?
2. Who initiated it?
3. How much money is involved?
4. Who approved it?
5. Who is responsible for the next step?
6. Has money actually moved?
7. What happens next?

If the UI cannot answer these questions, improve the state presentation.

---

# 117. Design Principle: Separate Human Decisions from Automation

The system may automate:

* timers
* notifications
* reconciliation
* state transitions
* bank status polling
* audit creation
* permission enforcement

The system must NOT autonomously make important human/group decisions that the group has not explicitly delegated.

Especially:

* who gets membership
* who gets removed
* whether a purchase is worthwhile
* whether a disputed proof is legitimate
* whether an amount should be increased
* whether someone deserves promotion
* whether money should be returned after departure

---

# 118. Design Principle: Human Trust + Technical Accountability

The app is not designed around:

> "Nobody can be trusted."

It is designed around:

> "Everyone trusts each other, and we want the system to make that trust safer."

Therefore:

* do not make every action unnecessarily bureaucratic
* do make financial actions explicit
* do preserve history
* do make exceptional actions visible
* do provide enough transparency for disputes
* do not replace human judgment with automation

---

# 119. Final Product Definition

The V1 application is:

> A private mobile-first shared-finance application for the TelAviv community that allows active TelAvivers to manage voluntary shared contributions, long-term savings Plans, and unanimously approved group purchase Requests, while allowing TelAvivlings to participate through voluntary donations and limited community visibility.

Its core financial workflow is:

```text
PLAN
  ↓
Save until affordable
  ↓
REQUEST
  ↓
Unanimous approval
  ↓
24h cooling-off
  ↓
LOCK
  ↓
Recipient volunteers
  ↓
Unanimous recipient selection
  ↓
Recipient accepts
  ↓
Bank payout
  ↓
Bank settlement
  ↓
Purchase
  ↓
Proof
  ↓
COMPLETED
```

Its core technical safety model is:

```text
COMMUNITY AUTHORITY
        ≠
TECHNICAL AUTHORITY
        ≠
BANK AUTHORITY
```

The group decides.

The software records and enforces the agreed rules.

The bank determines actual money movement.

The System Admin investigates.

The System Owner can recover the infrastructure and perform exceptional technical intervention, but cannot silently rewrite history or grant themselves financial authority.

---

# 120. Open Questions — Deliberately Not Implemented

The following remain outside the V1 behavioral contract until the group explicitly decides them:

* exact legal structure of the shared funds
* legal ownership of the bank account
* legal treatment of contributions
* legal treatment of donations
* whether departing members have any legal/contractual claim
* exact membership admission process
* exact membership removal process
* exact TelAvivling → TelAviver progression rules
* formal group governance beyond the current unanimous Request system
* exact bank/provider
* exact TWINT integration
* exact bank API capabilities
* exact production account structure
* whether direct card payments are used
* long-term refund mechanisms
* price-change workflows
* partial payouts
* unused-money return automation
* automatic recipient selection
* advanced Plan governance
* advanced recognition/reward system
* formal legal agreement wording
* legal retention requirements

Until these are decided, the application should NOT invent them.

---

# 121. Golden Rules

If a future implementation decision is unclear, prioritize these rules in order:

1. **Do not move money incorrectly.**
2. **Do not hide what happened.**
3. **Do not destroy history.**
4. **Do not grant technical users financial authority merely because they maintain the system.**
5. **Do not let money buy voting power.**
6. **Do not assume inactivity means approval.**
7. **Do not guess when bank state is unknown.**
8. **Do not invent group policy.**
9. **Do not make V1 more complicated than necessary.**
10. **When in doubt, preserve trust, transparency, and reversibility.**

The system should always be designed so that a future maintainer can answer:

> Who did what, when, why, under which permissions, what did the group approve, what did the bank actually do, and what happened afterward?

If the system can answer that reliably, the architecture is doing its job.
