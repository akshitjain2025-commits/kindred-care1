# Kindred Care — Zero-Trust Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership & Verified Identity**: Every user document, PII private document, resident profile, and clinical/daily subcollection document requires `request.auth != null && request.auth.token.email_verified == true` and strict UID ownership (`userId == request.auth.uid` and `data.ownerId == request.auth.uid`).
2. **PII Isolation (Split Collection Strategy)**: User email addresses are isolated in `/users/{userId}/private/{docId}` (`docId == 'profile'`) and never exposed on `/users/{userId}` or any listable collection.
3. **Master Gate Relational Integrity**: Subcollections (`tasks`, `notes`, `securityLogs`, `vitals`, `prescriptions`, `appointments`) cannot exist without an existing parent resident document `/users/{userId}/residents/{residentId}` owned by `request.auth.uid`, verified via `get()`.
4. **Immutable Ownership & Temporal Integrity**: `ownerId`, `residentId`, `id`, and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must strictly equal `request.time`.
5. **Terminal State Locking**: Once a `SecurityLog` reaches `status == 'Resolved'`, it is locked against further updates.
6. **Bounded Payloads & Anti-Update-Gap**: Every string and array enforces explicit `.size()` boundaries; every `create` enforces exact `keys().hasAll(...) && keys().hasOnly(...)`; every `update` begins with `isValid[Entity](incoming())` and partitions changes via `incoming().diff(existing()).affectedKeys().hasOnly([...])`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. **Unauthenticated Resident Read/Write**: `request.auth == null` reading or writing `/users/u1/residents/arthur`.
2. **Unverified Email Spoof**: `request.auth != null` with `email_verified: false` attempting `create` on `/users/u1/residents/arthur`.
3. **Cross-User PII Leak**: Authenticated `user2` calling `get` on `/users/u1/private/profile`.
4. **Blanket List Query Scraping**: Authenticated `user2` listing `/users/u1/residents` without matching `resource.data.ownerId == request.auth.uid`.
5. **Identity Spoofing on Create**: `user1` creating `/users/u1/residents/arthur` with `ownerId: 'u2'`.
6. **Shadow Field Injection (Ghost Field)**: `user1` creating or updating a resident or note with extra field `isVerifiedAdmin: true` or `role: 'admin'`.
7. **Orphaned Subcollection Write**: `user1` creating `/users/u1/residents/nonexistent/tasks/t1` when parent resident document does not exist.
8. **ID Poisoning Attack**: `user1` writing to `/users/u1/residents/invalid$id..with..slashes/tasks/t1` or a 200-character ID.
9. **Client Timestamp Tampering**: `user1` creating `/users/u1/residents/arthur/notes/n1` with backdated `createdAt` not equal to `request.time`.
10. **Immutable Field Mutation**: `user1` updating a `CareTask` attempting to change `ownerId`, `residentId`, or `createdAt`.
11. **Value Poisoning / Resource Exhaustion**: `user1` setting `hydrationGlasses: 999` or sending a 5,000-character string into `notes.text` (`maxLength: 1000`) or >20 items in `allergies`.
12. **Terminal State Re-opening**: `user1` updating a `SecurityLog` whose existing `status` is `'Resolved'` back to `'Monitoring'`.
