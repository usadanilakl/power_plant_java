---
title: Secrets
type: convention
status: current
deployable: []
domain: []
concern: [security, build]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# Secrets

This is the one convention area that does not depend on any pending decision, so it
is written first.

## What counts as a secret

Anything that grants access, proves identity, or would let a holder act as the
system: passwords, API keys, client secrets, certificates and their passphrases,
signing keys, JWT keys, database credentials, connection strings containing
credentials, and webhook URLs that carry an embedded token.

Not secrets: hostnames, port numbers, public URLs, feature flags, tuning values.
These are configuration and belong in version control, where their history is useful.

## Rules

1. **No secret is ever committed**, in any form, including in tests, fixtures,
   examples, comments, or documentation.
2. **No secret is ever logged**, including inside a serialised object or an
   exception message. Types holding secrets override `toString()`.
3. Secrets reach a process **through the environment or a secret store**, never
   through a file in the repository tree.
4. Every secret has a **documented owner and rotation procedure** before it is first
   used.
5. A secret that has ever been committed is **compromised and must be rotated**,
   even after a history rewrite. Removing it from history is cleanup, not remediation.
6. Example and template files (`*.example`, `*.template`) contain **placeholders
   only**, and are committed so the required set of secrets is discoverable.

## Enforcement

| Rule | Enforced by | Fails where |
|---|---|---|
| 1 | gitleaks | pre-commit **and** CI — pre-commit alone is bypassable |
| 2 | lint rule on logging of annotated types | CI |
| 3 | no file matching secret patterns outside ignore rules | CI |
| 4 | secret inventory document must list every key the config loader requires | CI |
| 6 | every key in an `.example` file must exist in the inventory, and vice versa | CI |

Rule 5 is a human procedure and cannot be automated. It is stated here rather than
in a guide because it is the direct consequence of rule 1 failing, and it must be
read alongside it.

## Distribution

Different deployables have genuinely different constraints, so the mechanism differs.

| Deployable | Mechanism | Notes |
|---|---|---|
| **hub** | environment variables from the host / service manager | Single controlled machine |
| **desktop** | OS credential store | Multiple machines outside direct control; a file on disk is readable by anything running as that user |
| **pwa** | **none** | A browser application cannot hold a secret. Anything it can read, a user can read |
| **electron-shell** | OS credential store | Same reasoning as desktop |

The PWA row is a constraint, not an omission. Any design that requires the PWA to
authenticate to a third party directly needs a token minted per session by the hub,
scoped and short-lived — never a shared credential shipped to the client.

## Known exceptions

None yet. Add them here with a reason when they arise.

## Carried forward from the current system

Not decisions, but facts the new design must account for:

- A certificate file (`certificate.pfx`) currently lives on disk on desktop
  installs and is reachable by any process running as that user. Rule 3 exists
  because of it.
- Secrets are currently spread across `application-secrets.properties` and several
  Electron runtime config files, with no single inventory. Rule 4 exists because of
  that.
