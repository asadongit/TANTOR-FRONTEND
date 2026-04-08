import { Route } from 'react-router-dom';
import DomainManagement from './Overview/DomainManagement/Homepage';
import MatchConfiguration from './MatchandMerge/MatchConfiguration/MatchConfiguration';
import SurvivorshipRules from './MatchandMerge/SurvivorshipRules/SurvivorshipRules';
import CrossDomainLinkHomepage from './Overview/CrossDomainLinks/CrossDomainLinkHomepage';
import ReviewQueue from './MatchandMerge/ReviewQueue/ReviewQueue';
const PREFIX = '/datagovernance/mdm';

export const MDMRoutes = (
  <>
    {/* Overview */}
    <Route path={`${PREFIX}/overview/domain-management`} element={<DomainManagement />} />
    {/* <Route path={`${PREFIX}/overview/golden-records`} element={<GoldenRecordsHomepage />} /> */}
    {/* <Route path={`${PREFIX}/overview/entity-view`} element={<EntityView />} /> */}
    <Route path={`${PREFIX}/overview/cross-domain-links`} element={<CrossDomainLinkHomepage />} />

    {/* Match & Merge */}
    <Route path={`${PREFIX}/match&merge/match-configuration`} element={<MatchConfiguration />} />
    <Route path={`${PREFIX}/match&merge/survivorship-rules`} element={<SurvivorshipRules />} />
    {/* <Route path={`${PREFIX}/match&merge/match-jobs`} element={<MatchJobs />} /> */}
    <Route path={`${PREFIX}/match&merge/review-queue`} element={<ReviewQueue />} />

    {/* Hierarchy Manager */}
    {/* <Route path={`${PREFIX}/hierarchy-manager/hierarchy-definition`} element={<HierarchyDefinition />} /> */}
    {/* <Route path={`${PREFIX}/hierarchy-manager/visual-hierarchy`} element={<VisualHierarchy />} /> */}
    {/* <Route path={`${PREFIX}/hierarchy-manager/node-management`} element={<NodeManagement />} /> */}

    {/* Stewardship Console */}
    {/* <Route path={`${PREFIX}/stewardship-console/my-tasks`} element={<MyTasks />} /> */}
    {/* <Route path={`${PREFIX}/stewardship-console/task-queue`} element={<TaskQueue />} /> */}
    {/* <Route path={`${PREFIX}/stewardship-console/review-history`} element={<ReviewHistory />} /> */}
    {/* <Route path={`${PREFIX}/stewardship-console/sla-dashboard`} element={<SLADashboard />} /> */}

    {/* Data Sync */}
    {/* <Route path={`${PREFIX}/data-sync/sync-configuration`} element={<SyncConfiguration />} /> */}
    {/* <Route path={`${PREFIX}/data-sync/sync-monitor`} element={<SyncMonitor />} /> */}
    {/* <Route path={`${PREFIX}/data-sync/conflict-resolution`} element={<ConflictResolution />} /> */}
    {/* <Route path={`${PREFIX}/data-sync/api-gateway`} element={<APIGateway />} /> */}

    {/* Agent Mesh */}
    {/* <Route path={`${PREFIX}/agent-mesh/agent-dashboard`} element={<AgentDashboard />} /> */}
    {/* <Route path={`${PREFIX}/agent-mesh/agent-chat`} element={<AgentChat />} /> */}
  </>
);