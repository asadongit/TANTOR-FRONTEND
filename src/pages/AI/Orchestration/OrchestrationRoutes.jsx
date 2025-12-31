// HubRoutes.jsx
import { Route } from 'react-router-dom';
import Orchestration from './Orchestration';

const PREFIX = '/ai/orchestration';

export const OrchestrationRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<Orchestration />} />
  </>
);