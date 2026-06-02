import { Route } from 'react-router-dom';
import AgentMeshWrapper from './AgentMeshWrapper';

const PREFIX = '/ai/agent-mesh';

export const AgentMeshRoutes = (
  <Route path={`${PREFIX}`} element={<AgentMeshWrapper />} />
);
