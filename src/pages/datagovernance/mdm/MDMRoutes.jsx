import { Route } from 'react-router-dom';
import DomainManagement from './Overview/DomainManagement/DomainManagement';
import MatchConfiguration from './MatchandMerge/MatchConfiguration/MatchConfiguration';
import SurvivorshipRules from './MatchandMerge/SurvivorshipRules/SurvivorshipRules';
import CrossDomainLinkHomepage from './Overview/CrossDomainLinks/CrossDomainLinkHomepage';
import ReviewQueue from './MatchandMerge/ReviewQueue/ReviewQueue';
import GoldenRecordsHomepage from './Overview/GoldenRecords/GoldenRecordHomepage';
import AgentDashboard from './AgentMesh/AgentMeshDashboard/AgentDashboard';
import AgentCatalog from './AgentMesh/AgentMeshDashboard/AgentCatalog';
import EntityView from './Overview/GoldenRecords/EntityView';
import HierarchyDefinition from "./HierarchyManager/HierarchyDefinition";
import NodeManagement from "./HierarchyManager/NodeManagement/NodeManagement";
import MatchJobs from './MatchandMerge/MatchJobs/MatchJobs';
import VisualHierarchy from './HierarchyManager/VisualHierarchy';
import AddDomainWizard from './Overview/DomainManagement/modals/AddDomainWizard';
import MyTasksHomepage from './StewardshipConsole/MyTasks/MyTasksHomepage';
import TaskQueueHomepage from './StewardshipConsole/TaskQueue/TaskQueueHomepage';
import ReviewHistoryHomepage from './StewardshipConsole/ReviewHistory/ReviewHistoryHomepage';
import SLADashboard from './StewardshipConsole/SlaDashboard/SLADashboard';
const PREFIX = '/datagovernance/mdm';

export const MDMRoutes = (
  <>
    {/* Overview */}
    <Route path={`${PREFIX}/overview/domain-management`} element={<DomainManagement />} />
    <Route path={`${PREFIX}/overview/domain-management/add-domain`} element={<AddDomainWizard />} />
    <Route path={`${PREFIX}/overview/golden-records`} element={<GoldenRecordsHomepage />} />
    <Route path={`${PREFIX}/overview/golden-records/entity-view`} element={<EntityView />} />
    <Route path={`${PREFIX}/overview/domain-management/add-domain`} element={<AddDomainWizard />} />
    <Route path={`${PREFIX}/overview/golden-records`} element={<GoldenRecordsHomepage />} />
    <Route path={`${PREFIX}/overview/golden-records/entity-view`} element={<EntityView />} />
    <Route path={`${PREFIX}/overview/cross-domain-links`} element={<CrossDomainLinkHomepage />} />

    {/* Match & Merge */}
    <Route path={`${PREFIX}/match&merge/match-configuration`} element={<MatchConfiguration />} />
    <Route path={`${PREFIX}/match&merge/survivorship-rules`} element={<SurvivorshipRules />} />
    <Route path={`${PREFIX}/match&merge/match-jobs`} element={<MatchJobs />} />
    <Route path={`${PREFIX}/match&merge/match-jobs`} element={<MatchJobs />} />
    <Route path={`${PREFIX}/match&merge/review-queue`} element={<ReviewQueue />} />

    {/* Hierarchy Manager */}
    <Route path={`${PREFIX}/hierarchy-manager/hierarchy-definition`} element={<HierarchyDefinition />} />
    <Route path={`${PREFIX}/hierarchy-manager/visual-hierarchy`} element={<VisualHierarchy />} />
    <Route path={`${PREFIX}/hierarchy-manager/node-management`} element={<NodeManagement />} />
    <Route path={`${PREFIX}/hierarchy-manager/hierarchy-definition`} element={<HierarchyDefinition />} />
    <Route path={`${PREFIX}/hierarchy-manager/visual-hierarchy`} element={<VisualHierarchy />} />
    <Route path={`${PREFIX}/hierarchy-manager/node-management`} element={<NodeManagement />} />

    {/* Stewardship Console */}
    <Route path={`${PREFIX}/stewardship-console/my-tasks`} element={<MyTasksHomepage  />} />
    <Route path={`${PREFIX}/stewardship-console/task-queue`} element={<TaskQueueHomepage />} />
    <Route path={`${PREFIX}/stewardship-console/review-history`} element={<ReviewHistoryHomepage />} />
    <Route path={`${PREFIX}/stewardship-console/sla-dashboard`} element={<SLADashboard />} />

    {/* Data Sync */}
    {/* <Route path={`${PREFIX}/data-sync/sync-configuration`} element={<SyncConfiguration />} /> */}
    {/* <Route path={`${PREFIX}/data-sync/sync-monitor`} element={<SyncMonitor />} /> */}
    {/* <Route path={`${PREFIX}/data-sync/conflict-resolution`} element={<ConflictResolution />} /> */}
    {/* <Route path={`${PREFIX}/data-sync/api-gateway`} element={<APIGateway />} /> */}

    {/* Agent Mesh */}
    <Route path={`${PREFIX}/agent-mesh/agent-dashboard`} element={<AgentDashboard />} />
    <Route path={`${PREFIX}/agent-mesh/agent-catalog`} element={<AgentCatalog/>} />
    <Route path={`${PREFIX}/agent-mesh/agent-dashboard`} element={<AgentDashboard />} />
    <Route path={`${PREFIX}/agent-mesh/agent-catalog`} element={<AgentCatalog/>} />
    {/* <Route path={`${PREFIX}/agent-mesh/agent-chat`} element={<AgentChat />} /> */}
  </>
);