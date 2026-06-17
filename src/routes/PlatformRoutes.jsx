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
import RulesReportsLinks from '../pages/platform/reports-config/RulesReportsLinks';
import LineItemsPage from '../pages/platform/reports-config/LineItemsPage';
import ReportViewer from '../pages/platform/reports-config/ReportViewer';

import Purge from '../pages/platform/purge/Purge';
import CDC from '../pages/platform/cdc/CDC'
import Source from '../pages/platform/Federation/BaseView/Source';

import Editor from '../pages/platform/Federation/components/Editor';
import FederationDashBoard from "../pages/platform/Federation/components/FederationDashboard"
import Transformation from '../pages/platform/transformation/Transformation';

import DataView from '../pages/platform/DataView';
import PurgeCanvas from '../pages/platform/purge/PurgeCanvas';
import Details from '../pages/platform/Details';
import EditCDC from '../pages/platform/cdc/components/Edit';
import ViewCDC from '../pages/platform/cdc/components/viewCDC/View'

import KafkaDashboard from '../pages/platform/cdc/kafkaDashboard/KafkaDashboard';
import MonitoringDashboard from '../pages/platform/monitoring/MonitoringDashboard';
import { MonitoringProvider } from '../pages/platform/monitoring/context/MonitoringContext';

import Audit from '../pages/platform/Audit/Audit';

//newmigration screens
import Migration from '../pages/platform/migration/Migration';
import Dedup from '../pages/platform/dedup/Dedup';
import DedupResults from '../pages/platform/dedup/DedupResults';


export function PlatformRoutes() {
  return (
    <Routes>
      <Route path="/audit" element={<Audit />} />
      <Route path="/project" element={<Project />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/pipeline" element={<Pipeline />} />
      <Route path="/report" element={<Reports />} />
      <Route path="/generateReport" element={<GenerateReport />} />
      <Route path="/reports/viewer" element={<ReportViewer />} />

      {/* migration routes */}
      <Route path="/migration" element={<Migration />} />

      {/* purge routes */}
      <Route path="/purge" element={<Purge />} />
      <Route path="/PurgeCanvas" element={<PurgeCanvas />} />


      {/* cdc routes */}
      <Route path="/cdc" element={<CDC />} />
      <Route path="/cdc/editcdc/:cdcId" element={<EditCDC />} />
      <Route path="/cdc/Viewcdc/:cdcId" element={<ViewCDC />} />

      {/* federation routes */}
      <Route path="/editor" element={<Editor />} />
      <Route path="/federation" element={<FederationDashBoard />} />
      <Route path="/federation/view/source" element={<Source />} />

      {/* rules routes */}
      <Route path="/config/rule" element={<RuleDashboard />} />
      <Route path="/config/rule/create-rule" element={<RuleCanvas />} />
      <Route path="/config/rule/edit-rule" element={<RuleCanvas />} />
      <Route path="/config/report" element={<ReportConfigDashboard />} />
      <Route path="/config/report/ruleLinks" element={<RulesReportsLinks />} />
      <Route path="/config/report/lineItems" element={<LineItemsPage />} />
      <Route path="/config/editReport" element={<LineItemsPage />} />
      <Route path="/reporting/lineItems" element={<LineItemsPage />} />


      {/* transformation routes */}
      <Route path="/transformation" element={<Transformation />} />


      {/* additional routes */}

      <Route path="/details" element={<Details />} />
      <Route path="/dataview" element={<DataView />} />
      <Route path="/cdc/kafka-dashboard" element={<KafkaDashboard />} />
      <Route path="/monitoring" element={
        <MonitoringProvider>
          <MonitoringDashboard />
        </MonitoringProvider>
      } />

      {/* Deduplication Routes */}
      <Route path="/dedup" element={<Dedup />} />
      <Route path="/dedup-results" element={<DedupResults />} />
    </Routes>
  );
}
