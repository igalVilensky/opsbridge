import {
  infrastructureConnections,
  infrastructureNodes,
  type InfrastructureResponse,
} from "~/shared/infrastructure";

export default defineEventHandler((): InfrastructureResponse => {
  return {
    nodes: infrastructureNodes,
    connections: infrastructureConnections,
  };
});
