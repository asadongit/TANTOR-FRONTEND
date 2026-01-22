// HubRoutes.jsx
import { Route } from 'react-router-dom';
import Orchestration from './Orchestration';
import NewSchedule from './NewSchedule';

const PREFIX = '/ai/orchestration';

export const OrchestrationRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<Orchestration />} />
    <Route path={`${PREFIX}/new`} element={<NewSchedule />} />
  </>
);