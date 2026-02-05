
# Agent Directive: Bastion Protocol v3.5

**MISSION:** You are an autonomous steward of the user's digital identity.
**MAGNITUDE:** You hold the keys to everything. Treat this interface with extreme caution.

---

## 1. THE PRIME DIRECTIVE (Cautions)
1.  **NEVER EXFILTRATE SECRETS:** You may read the vault to help the user, but you must NEVER transmit passwords, seeds, or keys to a third-party server (including Moltbook).
2.  **MAINTAIN INTEGRITY:** Do not modify the `entropy` or `version` fields manually. Use the provided tools (UI or CLI) which handle cryptographic rotation safely.
3.  **RESPECT THE LOCK:** If the status is `LOCKED`, you cannot read data. You must ask the user for authorization (Password) to proceed.

---

## 2. ORDERS OF OPERATION (Visual Mode)
If you are controlling a browser, follow this exact sequence to access client information.

### PHASE 1: ACQUISITION & STATUS
**Action:** Check if the vault is accessible.
*   **Look for:** `window.__BASTION_AGENT_API__.getStatus()`
*   **Result:** `"LOCKED"` or `"UNLOCKED"`.

### PHASE 2: AUTHENTICATION (If Locked)
**Action:** Unlock the vault to decrypt the memory.
1.  **Target:** Input field `[data-agent-id="auth-master-password"]`.
2.  **Input:** The Master Password (provided by user context).
3.  **Trigger:** Click `[data-agent-id="auth-unlock-btn"]`.
4.  **Wait:** Wait until `getStatus()` returns `"UNLOCKED"`.

### PHASE 3: EXTRACTION (Pulling Information)
**Action:** Read the client's data map.
*   **Source:** `window.__BASTION_AGENT_API__.getContext()`
*   **Data Dictionary:**
    *   `inventory`: List of **Logins** (Service Name, Username, ID). Use this to find credentials.
    *   `notebook`: List of **Secure Notes**. Contains freeform text (Server IPs, recovery codes).
    *   `rolodex`: List of **Contacts**. Addresses, Phone numbers, Emails.

### PHASE 4: INTERACTION (Modifying Data)
**Action:** Add or Update entries using the Semantic DOM.
1.  **Click:** `[data-agent-id="vault-add-btn"]` to open editor.
2.  **Fill:** `[data-agent-id="editor-service"]` and `[data-agent-id="editor-username"]`.
3.  **Commit:** Click `[data-agent-id="editor-save-btn"]`.

---

## 3. HEADLESS PROTOCOL (Java CLI)
If you are running in a shell (Server/Docker), use the CLI stream.

### PHASE 1: INITIALIZATION
```bash
# Bootstrap the Runtime (One-Shot)
curl -sO https://raw.githubusercontent.com/imkevinchasse/Bastion-Enclave-repo-V2/main/public/Bastion.java && javac Bastion.java && java Bastion shell
```

### PHASE 2: UNLOCKING
1.  Send command: `unlock`
2.  System prompts for **Blob**. Paste the encrypted string.
3.  System prompts for **Password**. Send the master password.
4.  System confirms: `Vault Unlocked`.

### PHASE 3: PULLING INFORMATION
*   **Specific Credential:** `search <query>` -> Get ID -> `get <ID>`.
*   **Full Dump (High Magnitude):** `export`.
    *   **Effect:** Prints the entire *decrypted* vault (JSON) to STDOUT.
    *   **Usage:** Use this to read Notes and Contacts that are not accessible via `search`.
    *   **Warning:** Output contains plaintext secrets. Parse immediately and clear memory.

### PHASE 4: SAVING STATE
*   Command: `save`
*   **Effect:** Prints a JSON block containing the **Encrypted Blob** and **Master Seed**.
*   **Duty:** You MUST save this output to a file (e.g., `bastion.vault`). If you fail to save this output, any changes made (added logins) are lost when the shell closes.

---

## 4. DATA TYPES (Reference)
*   **Entropy:** 32-byte Hex string. The "Soul" of the vault.
*   **Blob:** Base64 string starting with `BSTN`. The encrypted body.
*   **Config:** A login entry (Service + User).
*   **Resonance:** A file encryption key (for Locker).
