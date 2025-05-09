import { Route, Routes } from 'react-router-dom';
import Project from '../pages/platform/Project';
import Connections from '../pages/platform/connection/Connections';
import Jobs from '../pages/platform/Jobs';
import Pipeline from '../pages/platform/Pipeline';

import Reports from '../pages/platform/reports/Reports';
import GenerateReport from '../pages/platform/reports/GenerateReport';

import RuleDashboard from '../pages/platform/rule-framework/RuleDashboard';
import RuleCanvas from '../pages/platform/rule-framework/RuleCanvas';

import ReportConfigDashboard from '../pages/platform/reports-config/ReportConfigDashboard';

import Metadata from '../pages/platform/metadata/Metadata';
import Archival from '../pages/platform/archival/Archival';
import ArchivalCanvas from '../pages/platform/archival/ArchivalCanvas';
import Purge from '../pages/platform/purge/Purge';
import CDC from '../pages/platform/cdc/CDC'
import Source from '../pages/platform/Federation/BaseView/Source';

import Editor from '../pages/platform/Federation/components/Editor';
import FederationDashBoard from "../pages/platform/Federation/components/FederationDashboard"


import DataView from '../pages/platform/DataView';
import PurgeCanvas from '../pages/platform/purge/PurgeCanvas';
import Details from '../pages/platform/Details';
import EditCDC from '../pages/platform/cdc/components/Edit';
export function PlatformRoutes() {
  return (
      <Routes>
        <Route path="/project" element={<Project />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/report" element={<Reports />} />
        <Route path="/generateReport" element={<GenerateReport />} />
        <Route path="/migration" element={<Archival />} />
        <Route path="/dataview" element={<DataView />} />
        <Route path="/metadata" element={<Metadata />} />
        <Route path="/purge" element={<Purge />} />
        <Route path="/cdc" element={<CDC />} />
        <Route path="/cdc/editcdc/:cdcId" element={<EditCDC />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/federation" element={<FederationDashBoard />} />
        <Route path="/federation/view/source" element={<Source />} />
        <Route path="/createMigration" element={<ArchivalCanvas />} />
        <Route path="/PurgeCanvas" element={<PurgeCanvas />} />
        <Route path="/config/rule" element={<RuleDashboard />} />
        <Route path="/config/rule/create-rule" element={<RuleCanvas />} />
        <Route path="/config/report" element={<ReportConfigDashboard />} />
        <Route path="/details" element={<Details />}/>
      </Routes>
  );
}
