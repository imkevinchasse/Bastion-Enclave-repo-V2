
import React, { useEffect, useState } from 'react';
import { VaultState } from '../types';
import { BastionSerializer } from '../services/serializer';
import { SecurityService } from '../services/securityService';

interface AgentBridgeProps {
  state: VaultState | null;
  status: 'LOCKED' | 'UNLOCKED' | 'INITIALIZING';
}

declare global {
    interface Window {
        __BASTION_AGENT_API__?: {
            ping: () => string;
            getStatus: () => string;
            getContext: () => any;
            runDiagnostics: () => any;
        }
    }
}

/**
 * AGENT BRIDGE
 * 
 * This component renders a hidden data layer specifically for automated agents
 * (OpenClaw, MoltBot, etc.) to ingest the application state deterministically.
 * 
 * It bypasses the need for visual scraping by providing a structured JSON
 * representation of the current context in the DOM.
 */
export const AgentBridge: React.FC<AgentBridgeProps> = ({ state, status }) => {
  const [payload, setPayload] = useState<string>('{}');

  useEffect(() => {
    // 1. Construct Safe Context Payload
    const contextData = {
      timestamp: Date.now(),
      status: status,
      protocol: "SOVEREIGN_V3.5",
      context: {
        item_count: state ? state.configs.length : 0,
        is_modified: state ? (state.lastModified > ((state as any)._lastBackup || 0)) : false,
        identity_tier: state?.identity?.tier || 'NONE',
        veteran_status: state?.identity?.veteran 
            ? `V${state.identity.veteran.version}` 
            : (state?.legacyOrigin ? `V${state.legacyOrigin}` : 'NONE')
      },
      // We expose the Config IDs and Names, but NEVER the entropy or derived keys here.
      // This allows bots to "see" the vault structure without compromising security.
      inventory: state ? state.configs.map(c => ({
        id: c.id,
        name: c.name,
        username: c.username,
        version: c.version,
        compromised: c.breachStats?.status === 'compromised'
      })) : []
    };

    setPayload(JSON.stringify(contextData, null, 2));

    // 2. Inject Active JS Hooks
    window.__BASTION_AGENT_API__ = {
        ping: () => "PONG",
        getStatus: () => status,
        getContext: () => contextData,
        runDiagnostics: () => SecurityService.checkIntegrity()
    };

    return () => {
        delete window.__BASTION_AGENT_API__;
    };
  }, [state, status]);

  return (
    <script 
      id="bastion-agent-bridge" 
      type="application/json" 
      dangerouslySetInnerHTML={{ __html: payload }} 
    />
  );
};
