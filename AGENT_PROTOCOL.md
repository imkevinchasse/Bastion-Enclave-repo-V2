
# BASTION AGENT PROTOCOL v1.1

**Target Audience:** Autonomous Agents (OpenClaw, MoltBot, ClawdBot)
**Purpose:** Instructions for programmatic interaction with the Bastion Enclave.

---

## 1. SYSTEM CONTEXT

You are operating **Bastion Enclave**, a zero-knowledge password vault.
The application runs entirely in the browser (client-side).
There is **NO BACKEND API** to call. All actions must be performed via the DOM or the exposed JS Bridge.

**Critical Safety Rules:**
1.  **Do not look for a login API endpoint.** It does not exist.
2.  **Do not attempt to scrape secrets visually.** Use the clipboard copy buttons.
3.  **Respect the encryption latency.** Key derivation (Argon2id) takes ~300ms. Wait for UI updates.

---

## 2. THE AGENT BRIDGE

The application exposes a structured JSON feed and a global API for agents.

### A. State Reading (Passive)
Locate the script tag: `#bastion-agent-bridge`
Parsing its `textContent` yields the current `VaultState` metadata.

```json
{
  "status": "UNLOCKED", // LOCKED | UNLOCKED
  "context": {
    "item_count": 5,
    "identity_tier": "guardian"
  },
  "inventory": [
    { "id": "uuid", "name": "Google", "username": "me@gmail.com" }
  ]
}
```

### B. Runtime Hooks (Active)
If you have JS execution capability, use `window.__BASTION_AGENT_API__`.

*   `ping()`: Returns "PONG" if the app is responsive.
*   `getStatus()`: Returns "LOCKED" or "UNLOCKED".
*   `getContext()`: Returns the full JSON context object.
*   `runDiagnostics()`: Triggers an integrity check and returns a report.

---

## 3. INTERACTION MAP (Selectors)

Use these stable `data-agent-id` attributes. Do NOT rely on Tailwind classes.

### Authentication Phase
*   **Master Password Input**: `[data-agent-id="auth-master-password"]`
*   **Unlock Button**: `[data-agent-id="auth-unlock-btn"]`
*   **Create New Vault Button**: `[data-agent-id="auth-create-btn"]`
*   **Switch to Create Tab**: `[data-agent-id="auth-tab-create"]`
*   **Switch to Unlock Tab**: `[data-agent-id="auth-tab-open"]`

### Vault Operations
*   **Search Box**: `[data-agent-id="vault-search"]`
*   **Add New Item Button**: `[data-agent-id="vault-add-btn"]`
*   **Item Card Container**: `[data-agent-id="vault-item-card"]`
*   **Copy Password Button**: `[data-agent-id="vault-copy-btn"]` (Inside Item Card)
*   **Backup Button**: `[data-agent-id="nav-backup-btn"]`

### Editor Modal
*   **Service Name Input**: `[data-agent-id="editor-service"]`
*   **Username Input**: `[data-agent-id="editor-username"]`
*   **Save Button**: `[data-agent-id="editor-save-btn"]`

---

## 4. STANDARD OPERATING PROCEDURES (SOPs)

### SOP-01: Unlocking the Vault
1.  Check `window.__BASTION_AGENT_API__.getStatus()`. If "UNLOCKED", abort.
2.  Type password into `[data-agent-id="auth-master-password"]`.
3.  Click `[data-agent-id="auth-unlock-btn"]`.
4.  Wait for `getStatus()` to return "UNLOCKED".

### SOP-02: Adding a Credential
1.  Click `[data-agent-id="vault-add-btn"]`.
2.  Wait for editor modal.
3.  Type Service into `[data-agent-id="editor-service"]`.
4.  Type Username into `[data-agent-id="editor-username"]`.
5.  Click `[data-agent-id="editor-save-btn"]`.
6.  Verify `getContext().inventory` count incremented.

### SOP-03: Retrieving a Password
1.  Type search query into `[data-agent-id="vault-search"]`.
2.  Locate target `[data-agent-id="vault-item-card"]`.
3.  Click `[data-agent-id="vault-copy-btn"]` inside that card.
4.  Read system clipboard. **Do NOT try to read the password from the DOM.** It is masked.

### SOP-04: Persistence & Synchronization (CRITICAL)
**Constraint:** The vault uses an append-only versioning system. The encryption key for the vault blob changes with *every* save operation (Argon2id salt rotation).
1.  **Trigger:** After successfully completing `SOP-02` (Adding/Editing) or any write operation.
2.  **Mandatory Sync:** You MUST perform one of the following:
    *   **Option A (Blob Download):** Click `[data-agent-id="nav-backup-btn"]` to download the new encrypted state. **Delete your previous backup file immediately; it is now stale.**
    *   **Option B (Seed Tracking):** If utilizing the JS Bridge, read the updated `entropy` or `version` from `getContext()`.
3.  **Failure to Sync:** If you do not sync after a write, your previous local copy will be rejected by the vault protocol on next load due to version mismatch.

---

**END OF PROTOCOL**
