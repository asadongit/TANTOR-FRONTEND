import { Route } from 'react-router-dom';
import Project from '../pages/platform/Project';
import Connections from '../pages/platform/Connections';
import Jobs from '../pages/platform/Jobs';
import Pipeline from '../pages/platform/Pipeline';
import Reports from '../pages/platform/Reports';
import Migration from '../pages/platform/migration/Migration';
import Transformation from '../pages/platform/Transformation';
import Purge from '../pages/platform/Purge';
import CDC from '../pages/platform/CDC';
import FederationDashBoard from '../pages/platform/Federation/FederationDashboard';
import Source from '../pages/platform/Federation/Source';
import MigrationCanvas from '../pages/platform/migration/MigrationCanvas';

export const PlatformRoutes = (
  <>
    <Route path="/project" element={<Project />} />
    <Route path="/connections" element={<Connections />} />
    <Route path="/jobs" element={<Jobs />} />
    <Route path="/pipeline" element={<Pipeline />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/migration" element={<Migration />} />
    <Route path="/transformation" element={<Transformation />} />
    <Route path="/purge" element={<Purge />} />
    <Route path="/cdc" element={<CDC />} />
    <Route path="/federation" element={<FederationDashBoard />} />
    <Route path='/federation/view/source' element={<Source />} />
    <Route path="/createMigration" element={<MigrationCanvas />}></Route>
  </>
);