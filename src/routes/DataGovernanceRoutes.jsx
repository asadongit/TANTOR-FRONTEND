import { Route } from 'react-router-dom';
import DataCatalogue from '../pages/datagovernance/DataCatalogue/DataCatalogue';
import BusinessCatalogue from '../pages/datagovernance/BusinessCatalogue';
import Databot from '../pages/datagovernance/Databot';
import Reports from '../pages/datagovernance/Reports';
import Import from '../pages/datagovernance/Import';
import CustomAddition from '../pages/datagovernance/CustomAddition';
import { UserRoutes } from '../pages/datagovernance/User/UserRoutes';
import { DataCatalogueRoutes } from '../pages/datagovernance/DataCatalogue/DataCatalogueRoutes';
import { DataShieldRoutes } from '../pages/datagovernance/DataShield/DataShieldRoutes';
import {DataAssuranceRoutes} from '../pages/datagovernance/DataAssurance/DataAssuranceRoutes';


export const DataGovernanceRoutes = (
  <>
    {UserRoutes}
    {DataCatalogueRoutes}
    {DataShieldRoutes}
    {DataAssuranceRoutes}
    <Route path="/datagovernance/business-catalogue" element={<BusinessCatalogue />} />
    {/* <Route path="/data-shield" element={<DataShield />} /> */}
    <Route path="/datagovernance/databot" element={<Databot />} />
    <Route path="/datagovernance/reports" element={<Reports />} />
    <Route path="/datagovernance/import" element={<Import />} />
    <Route path="/datagovernance/custom-addition" element={<CustomAddition />} />
  </>
);