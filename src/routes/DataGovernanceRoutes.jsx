import { Route } from 'react-router-dom';
import DataCatalogue from '../pages/datagovernance/DataCatalogue/DataCatalogue';
import DataAssurance from '../pages/datagovernance/DataAssurance';
import BusinessCatalogue from '../pages/datagovernance/BusinessCatalogue';
import DataShield from '../pages/datagovernance/DataShield';
import Databot from '../pages/datagovernance/Databot';
import Reports from '../pages/datagovernance/Reports';
import Import from '../pages/datagovernance/Import';
import CustomAddition from '../pages/datagovernance/CustomAddition';
import { UserRoutes } from '../pages/datagovernance/User/UserRoutes';
import { DataCatalogueRoutes } from '../pages/datagovernance/DataCatalogue/DataCatalogueRoutes';

export const DataGovernanceRoutes = (
  <>
    {UserRoutes}
    {DataCatalogueRoutes}
    <Route path="/data-assurance" element={<DataAssurance />} />
    <Route path="/business-catalogue" element={<BusinessCatalogue />} />
    <Route path="/data-shield" element={<DataShield />} />
    <Route path="/databot" element={<Databot />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/import" element={<Import />} />
    <Route path="/custom-addition" element={<CustomAddition />} />
  </>
);