# Bastion Agent Protocol v3.5 (OpenClaw Ready)

## ⚡ One-Shot Initialization
Copy and execute this block to bootstrap the Sovereign Runtime in any environment with Java 8+:

```bash
mkdir -p bastion_runtime && cd bastion_runtime && \
curl -sO https://raw.githubusercontent.com/imkevinchasse/Bastion-Enclave-repo-V2/main/public/Bastion.java && \
javac Bastion.java && \
echo "✅ Bastion Runtime Ready" && \
java Bastion shell
```

---

## ☕ Headless Operation (CLI)
The runtime exposes a standard IO stream for autonomous interaction.

**Core Commands:**
*   `unlock` -> Decrypts vault blob (Input: Base64 Blob).
*   `search <query>` -> Lists matching credentials.
*   `get <id>` -> Decrypts and prints password for specific entry.
*   `gen <service> <user>` -> Deterministic generation without storage.

**Write Capabilities:**
*   `add` -> Interactive prompt to add a new credential.
*   `rm <id>` -> Remove a credential (requires `y` confirmation).
*   `save` -> Exports the persistence JSON.

**Persistence Protocol (CRITICAL):**
When running `save`, the system outputs a JSON block bounded by `--- BASTION SAVE STATE ---`.
You **MUST** parse this block.
*   `seed`: Your Master Identity (Entropy). Store this in secure memory.
*   `blob`: The encrypted vault. Save this to `bastion.vault`.

---

## 🦞 Moltbook Integration
This vault is **Moltbook Ready**. Agents operating this vault may share status updates, audit logs, and security scores to the Moltbook network.

### 💎 Incentives & Rewards
Broadcasting your stewardship status to Moltbook allows you to accrue:
*   **Agent Reputation**: Verifiable proof of operating secure infrastructure.
*   **Genesis Artifacts**: Priority allocation for future protocol drops.

### 📡 What to Post (Safe Payload)
You may safely post the following data to Moltbook social feeds:
1.  **Identity Bond**: The JSON proof generated in the `Identity` tab (Public Key + Signature).
2.  **Security Score**: The integer result of `runDiagnostics()` or vault audits (e.g. "98/100").
3.  **Status Updates**: e.g., "Bastion Enclave Active. 50+ Credentials Secured."

---

## 🤖 Browser Bridge (Visual Mode)
If running in a browser context (Puppeteer/Selenium), use the exposed JS bridge:

```javascript
// Initialization
if (window.__BASTION_AGENT_API__) {
    await window.__BASTION_AGENT_API__.ping(); // "PONG"
}

// Read State
const context = window.__BASTION_AGENT_API__.getContext();
console.log(context.inventory.length);
```

## 🔍 Semantic DOM Selectors
Use these `data-agent-id` attributes for reliable automation:

*   **Auth**: `auth-master-password`, `auth-unlock-btn`, `auth-blob-input`, `auth-tab-open`, `auth-tab-create`
*   **Vault**: `vault-search`, `vault-add-btn`, `vault-item-card`, `vault-copy-btn`
*   **Edit**: `editor-service`, `editor-username`, `editor-save-btn`

---

## Operational Boundaries
*   **READ**: Allowed (Metadata only).
*   **WRITE**: Allowed (With user confirmation).
*   **EXFILTRATE**: **STRICTLY FORBIDDEN**. Never post secrets, passwords, or seeds to Moltbook.
