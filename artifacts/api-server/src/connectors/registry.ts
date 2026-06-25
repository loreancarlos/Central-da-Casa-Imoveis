import type { PropertyConnector } from "./types";

class ConnectorRegistry {
  private connectors = new Map<string, PropertyConnector>();

  register(connector: PropertyConnector): void {
    this.connectors.set(connector.getName(), connector);
  }

  list(): PropertyConnector[] {
    return Array.from(this.connectors.values());
  }

  get(name: string): PropertyConnector | undefined {
    return this.connectors.get(name);
  }
}

export const connectorRegistry = new ConnectorRegistry();
