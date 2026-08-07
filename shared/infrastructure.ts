export type InfrastructureNodeType = "application" | "integration" | "database" | "ai";
export type InfrastructureNodeStatus = "healthy" | "degraded" | "unknown";

export type InfrastructureNode = {
  id: string;
  name: string;
  type: InfrastructureNodeType;
  status: InfrastructureNodeStatus;
  description: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
};

export type InfrastructureConnection = {
  from: string;
  to: string;
};

export type InfrastructureResponse = {
  nodes: InfrastructureNode[];
  connections: InfrastructureConnection[];
};

export const infrastructureNodes: InfrastructureNode[] = [
  {
    id: "opsbridge-api",
    name: "OpsBridge API",
    type: "application",
    status: "healthy",
    description: "Main orchestration service coordinating cases, approvals, and system updates.",
    position: { x: 0, y: 0, z: 0 },
  },
  {
    id: "crm",
    name: "CRM",
    type: "integration",
    status: "healthy",
    description: "Source of customer and case context used by OpsBridge workflows.",
    position: { x: -4.5, y: 1, z: -1 },
  },
  {
    id: "fulfillment",
    name: "Fulfillment",
    type: "integration",
    status: "healthy",
    description: "Upstream fulfillment system for order lookups and operational updates.",
    position: { x: 4.2, y: 0.5, z: -0.5 },
  },
  {
    id: "call-system",
    name: "Call System",
    type: "integration",
    status: "degraded",
    description: "Telephony integration used for call snapshots and customer support events.",
    position: { x: 0.5, y: 0.2, z: 4.3 },
  },
  {
    id: "database",
    name: "Database",
    type: "database",
    status: "healthy",
    description: "Persistent store for cases, snapshots, and workflow state.",
    position: { x: 0, y: -2.8, z: 0.5 },
  },
  {
    id: "ai-provider",
    name: "AI Provider",
    type: "ai",
    status: "unknown",
    description: "External LLM provider used for assistance generation and enrichment support.",
    position: { x: 3.6, y: 2.2, z: 3.1 },
  },
];

export const infrastructureConnections: InfrastructureConnection[] = [
  { from: "opsbridge-api", to: "crm" },
  { from: "opsbridge-api", to: "fulfillment" },
  { from: "opsbridge-api", to: "call-system" },
  { from: "opsbridge-api", to: "database" },
  { from: "opsbridge-api", to: "ai-provider" },
];
