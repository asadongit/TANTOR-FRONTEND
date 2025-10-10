import { Route } from 'react-router-dom';
import Databot from '../pages/datagovernance/Databot/Databot';
import Import from '../pages/datagovernance/Import';
import CustomAddition from '../pages/datagovernance/CustomAddition';
import { UserRoutes } from '../pages/datagovernance/User/UserRoutes';
import { DataCatalogueRoutes } from '../pages/datagovernance/DataCatalogue/DataCatalogueRoutes';
import { DataShieldRoutes } from '../pages/datagovernance/DataShield/DataShieldRoutes';
import {DataAssuranceRoutes} from '../pages/datagovernance/DataAssurance/DataAssuranceRoutes';
import { BusinessCatalogueRoutes } from '../pages/datagovernance/BusinessCatalogue/BusinessCatalogueRoutes';
import Reports from '../pages/datagovernance/Reports/Reports';


export const DataGovernanceRoutes = (
  <>
    {UserRoutes}
    {DataCatalogueRoutes}
    {DataShieldRoutes}
    {DataAssuranceRoutes}
    {BusinessCatalogueRoutes}
    <Route path="/datagovernance/databot" element={<Databot />} />
    <Route path="/datagovernance/reports" element={<Reports />} />
    <Route path="/datagovernance/import" element={<Import />} />
    <Route path="/datagovernance/custom-addition" element={<CustomAddition />} />
  </>
);