import { Route } from 'react-router-dom';
import Project from '../pages/platform/Project';
import Connections from '../pages/platform/Connections';
import Jobs from '../pages/platform/Jobs';
import Pipeline from '../pages/platform/Pipeline';

import Reports from '../pages/platform/reports/Reports';
import GenerateReport from '../pages/platform/reports/GenerateReport';

import Migration from '../pages/platform/migration/Migration';
import Transformation from '../pages/platform/archival/Archival';
import Purge from '../pages/platform/purge/Purge';
import CDC from '../pages/platform/cdc/CDC'
import CDCList from '../pages/platform/cdc/CDCList';
import Source from '../pages/platform/Federation/BaseView/Source';
import MigrationCanvas from '../pages/platform/migration/MigrationCanvas';

import Editor from '../pages/platform/Federation/components/Editor';
import FederationDashBoard from "../pages/platform/Federation/components/FederationDashboard"


import DataView from '../pages/platform/DataView';
import PurgeCanvas from '../pages/platform/purge/PurgeCanvas';


export const PlatformRoutes = (
  <>
    <Route path="/project" element={<Project />} />
    <Route path="/connections" element={<Connections />} />
    <Route path="/jobs" element={<Jobs />} />
    <Route path="/pipeline" element={<Pipeline />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/generateReport" element={<GenerateReport />}></Route>
    <Route path="/migration" element={<Migration />} />
    <Route path="/dataview" element={<DataView/>} />
    <Route path="/transformation" element={<Transformation />} />
    <Route path="/purge" element={<Purge />} />
    <Route path="/cdc" element={<CDC />} />
    <Route path="/cdclist" element={<CDCList />} />
    <Route path="/editor" element ={<Editor />} />
    <Route path="/federation" element={<FederationDashBoard />}/>
    <Route path='/federation/view/source' element={<Source />} />
    <Route path="/createMigration" element={<MigrationCanvas />}></Route>
    <Route path='/PurgeCanvas' element={<PurgeCanvas />}></Route>
  </>
);