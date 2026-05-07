import { Route } from 'react-router-dom';
import { HubRoutes} from '../pages/AI/Hub/HubRoutes';
import {AIPlaygroundRoutes} from '../pages/AI/AIPlayground/AIPlaygroundRoutes';
import { OrchestrationRoutes } from '../pages/AI/Orchestration/OrchestrationRoutes';
import Observability from '../pages/AI/Observability/Observability';
import F1Mode from '../pages/AI/F1Mode/F1Mode';
import Predictive from '../pages/AI/Prescriptive Analysis/PrescriptiveAnalysis';


export const AIRoutes = (
  <>
    {HubRoutes}
    {AIPlaygroundRoutes}
    {OrchestrationRoutes}
    <Route path="/ai/observability" element={<Observability />} />
    <Route path="/ai/f1mode" element={<F1Mode />} />
    <Route path="/ai/prescriptive" element={<Predictive />} />
  </>
);