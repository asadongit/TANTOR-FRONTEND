import { Route } from 'react-router-dom';
import { HubRoutes} from '../pages/AI/Hub/HubRoutes';
import {AIPlaygroundRoutes} from '../pages/AI/AIPlayground/AIPlaygroundRoutes';


export const AIGovernanceRoutes = (
  <>
    {HubRoutes}
    {AIPlaygroundRoutes}
  </>
);