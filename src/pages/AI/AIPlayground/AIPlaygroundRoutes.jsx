import { Route } from 'react-router-dom';
import AIPlaygroundDashboard from './AIPlaygroundDashboard';

const PREFIX = '/ai/playground';

export const AIPlaygroundRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<AIPlaygroundDashboard />} />
  </>
);
