import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Bot, Copy } from "lucide-react";
import {
  ChartBarIcon,
  CubeIcon,
  LinkIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowsUpDownIcon,
  ArrowsRightLeftIcon,
  TrashIcon,
  ServerStackIcon,
  ShareIcon,
  UserIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  LayoutDashboard,
  Network,
  Database,
  FolderKanban,
  Box,
  Sparkles,
  GitBranch,
  Store,
  Activity,
  Users,
  Moon,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAIPlayground } from '../context/AIPlaygroundContext';
import DashboardIcon from '../assets/space_dashboard.svg';
import AIHubIcon from '../assets/ai/hub.svg';
import AIPlaygroundIcon from '../assets/ai/aiplayground.svg';
import AgentMeshIcon from '../assets/ai/agentmesh.svg';
import CollaboratorIcon from '../assets/ai/collabarator.svg';
import MarketplaceIcon from '../assets/ai/margetplace.svg';
import NeoModeIcon from '../assets/ai/neomode.svg';
import ObservabilityIcon from '../assets/ai/observability.svg';
import AccountTreeIcon from '../assets/ai/account_tree.svg';
import { usePersonaStatuses } from '../hooks/dataGovernance/Users/auth';

const ACTIVE_COLOR = '#8E77BB';
const INACTIVE_ICON_COLOR = '#818181';
const INACTIVE_TEXT_COLOR = '#282F49';

const ACTIVE_FILTER = 'brightness(0) saturate(100%) invert(54%) sepia(25%) saturate(471%) hue-rotate(223deg)';
const INACTIVE_FILTER = 'brightness(0) saturate(100%) invert(53%) sepia(6%) saturate(300%) hue-rotate(190deg) brightness(90%)';

const Sidebar = ({ activeSection, isCollapsed, toggleSidebar, setIsSidebarCollapsed }) => {
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedSubItem, setExpandedSubItem] = useState(null);
  const [currentActiveSection, setCurrentActiveSection] = useState(activeSection);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showF1CancelModal, setShowF1CancelModal] = useState(false);
  const [pendingF1Navigation, setPendingF1Navigation] = useState(null);
  const [isF1CancelLoading, setIsF1CancelLoading] = useState(false);
  const hostnameAI = window._env_?.VITE_AI_API;
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  const { decodedToken } = useAuth();
  const { isAIPlaygroundActive, resetAllStates, datasetState, workflowsState, F1Mode: F1ModeCtx, setF1Mode ,activeWorkflowId} = useAIPlayground();
  const { personaStatuses, isLoading: personasLoading } = usePersonaStatuses();
  const navigate = useNavigate();
  const workflowState = activeWorkflowId
  ? (workflowsState[activeWorkflowId] ?? null)
  : null; 

  const location = useLocation();
  const hasAutoCollapsedForEditor = useRef(false);

  useEffect(() => {
    if (location.pathname === '/editor') {
      if (!hasAutoCollapsedForEditor.current && setIsSidebarCollapsed) {
        setIsSidebarCollapsed(true);
        hasAutoCollapsedForEditor.current = true;
      }
    } else {
      hasAutoCollapsedForEditor.current = false;
    }
  }, [location.pathname, setIsSidebarCollapsed]);

  const isF1ModeActive = !!F1ModeCtx?.session_id;
  const f1SessionId = F1ModeCtx?.session_id ?? null;

  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection && ['platform', 'datagovernance', 'ai'].includes(savedSection)) {
      setCurrentActiveSection(savedSection);
    } else {
      setCurrentActiveSection(activeSection);
    }
  }, [activeSection]);

  const { isGlobalAdmin, isPolicyManager, isUserManager, isDataAuditor, isConnectionCreation  } = useMemo(() => {
  const hasRoleInToken = (roleKey) =>
    decodedToken?.resource_access?.darch?.roles?.some(
      role => role.toLowerCase() === roleKey
    );

  return {
    isGlobalAdmin:   hasRoleInToken('global-admin'),
    isPolicyManager: hasRoleInToken('persona:policy manager') && personaStatuses['persona:policy manager'] === true,
    isUserManager:   hasRoleInToken('persona:user manager')   && personaStatuses['persona:user manager']   === true,
    isDataAuditor:   hasRoleInToken('persona:data auditor')   && personaStatuses['persona:data auditor']   === true,
    isConnectionCreation: hasRoleInToken('persona:connection manager')   && personaStatuses['persona:connection manager']   === true,
};
}, [decodedToken, personaStatuses]);

  const toggleExpand = (e, routeName) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItem(prev => prev === routeName ? null : routeName);
  };

  const toggleSubExpand = (e, subRouteName) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSubItem(prev => prev === subRouteName ? null : subRouteName);
  };

  const handleNavClick = (e, path, routeName) => {
    if ((routeName === 'F1 Mode' || routeName === 'AI Playground') && !isCollapsed) {
      toggleSidebar();
    }

    const isAIRoute = (path.startsWith('/ai') || path === '/dashboard');
    const currentPath = window.location.pathname;
    const isCurrentlyInAIPlayground = currentPath.startsWith('/ai/playground');
    const isCurrentlyInF1Mode = currentPath.startsWith('/ai/f1mode');

    if (isF1ModeActive && isCurrentlyInF1Mode && path !== '/ai/f1mode') {
      e.preventDefault();
      setPendingF1Navigation(path);
      setShowF1CancelModal(true);
      return;
    }

    if (isAIPlaygroundActive && isAIRoute && isCurrentlyInAIPlayground) {
      e.preventDefault();
      setPendingNavigation(path);
      setShowCancelModal(true);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setPendingNavigation(null);
  };

  const handleConfirmCancel = async () => {
    setIsCancelLoading(true);
    try {
      await fetch(`${hostnameAI}/cleanup/cleanup`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ensemble_id: datasetState.ensembleId,
          training_flag: workflowState?.completedJobs?.apiResponse !== null
        })
      });
    } catch (error) {
      console.error('Cleanup API error:', error);
    }
    resetAllStates();
    setIsCancelLoading(false);
    setShowCancelModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleF1CancelModalClose = () => {
    setShowF1CancelModal(false);
    setPendingF1Navigation(null);
  };

  const handleF1ConfirmCancel = async () => {
    setIsF1CancelLoading(true);
    try {
      await fetch(`${hostnameAI}/data/f1/session/${f1SessionId}`, {
        method: 'DELETE',
        headers: { 'accept': 'application/json' },
      });
    } catch (error) {
      console.error('F1 Mode session cleanup error:', error);
    }
    setF1Mode(null);
    setIsF1CancelLoading(false);
    setShowF1CancelModal(false);
    if (pendingF1Navigation) {
      navigate(pendingF1Navigation);
      setPendingF1Navigation(null);
    }
  };

  const platformRoutes = [
    { name: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
    { name: 'Project', icon: CubeIcon, path: '/project' },
    { name: 'Connections', icon: LinkIcon, path: '/connections'},
    {
      name: 'Reports',
      icon: DocumentTextIcon,
      path: '/generateReport',
      subItems: [
        {
          name: 'Business Reports',
          subItems: [
            { name: 'Rules Config', path: '/config/rule' },
            { name: 'Reports Config', path: '/config/report' },
          ]
        },
        ...(isUserManager ? [{ name: 'Audit Report', path: '/audit' }] : []),
      ]
    },
    { type: 'divider' },
    { name: 'Migration', icon: ArrowsUpDownIcon, path: '/migration' },
    { name: 'Transformation', icon: ArrowsRightLeftIcon, path: '/transformation' },
    { name: 'Purge', icon: TrashIcon, path: '/purge' },
    { name: 'CDC', icon: ServerStackIcon, path: '/cdc' },
    { name: 'Federation', icon: ShareIcon, path: '/federation' },
    ...(window._env_?.VITE_ENABLE_DEDUP_MODULE === 'true' || window._env_?.ENABLE_DEDUP_MODULE === true ? [{ name: 'MDM', icon: Copy, path: '/dedup-group', expandOnly: true, subItems: [{ name: 'Rules Canvas', path: '/dedup' }, { name: 'Data Review Queue', path: '/dedup-results' }] }] : []),
  ];

  const DATAGOVERNANCE_PREFIX = '/datagovernance';

  const allDataGovernanceRoutes = [
    { name: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
    {
      name: 'User',
      requiresUserManager: true,
      icon: UserIcon,
      path: `${DATAGOVERNANCE_PREFIX}/user`,
      subItems: [
        { name: 'Role', path: `${DATAGOVERNANCE_PREFIX}/user/role` },
        { name: 'Group', path: `${DATAGOVERNANCE_PREFIX}/user/group` },
        { name: 'Sub-group', path: `${DATAGOVERNANCE_PREFIX}/user/sub-group` },
        { name: 'Persona', path: `${DATAGOVERNANCE_PREFIX}/user/persona` },
      ]
    },
    {
      name: 'Data Catalogue', icon: BookOpenIcon, path: `${DATAGOVERNANCE_PREFIX}/data-catalogue`,
      subItems: [
        { name: 'Database', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/database` },
        { name: 'Schema', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/schema` },
        { name: 'Table', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/table` },
        { name: 'Column', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/column` },
        //{ name: 'View', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/view` },
      ]
    },
    {
      name: 'Data Assurance', icon: ShieldCheckIcon, path: `${DATAGOVERNANCE_PREFIX}/data-assurance`, expandOnly: true,
      subItems: [
        {
          name: 'Data Quality',
          subItems: [
            { name: 'Data', path: `${DATAGOVERNANCE_PREFIX}/data-assurance/data` },
            { name: 'Metadata', path: `${DATAGOVERNANCE_PREFIX}/data-assurance/metadata` },
            { name: 'Rules', path: `${DATAGOVERNANCE_PREFIX}/data-assurance/rules` },
          ]
        },
        { name: 'Lineage', path: `${DATAGOVERNANCE_PREFIX}/data-assurance/lineage` },
      ]
    },
    {
      name: 'Business Catalogue', icon: ClipboardDocumentListIcon, path: `${DATAGOVERNANCE_PREFIX}/business-catalogue`,
      subItems: [
        { name: 'Glossary', path: `${DATAGOVERNANCE_PREFIX}/business-catalogue/glossary` },
      ]
    },
    {
      name: 'Data Shield', icon: ShieldCheckIcon, path: `${DATAGOVERNANCE_PREFIX}/data-shield`,
      expandOnly: true,
      subItems: [
        //{ name: 'Protection', path: `${DATAGOVERNANCE_PREFIX}/data-shield/protection` },
        { name: 'Policy', path: `${DATAGOVERNANCE_PREFIX}/data-shield/policy`, requiresPolicyManager: true },
        //{ name: 'Collaboration', path: `${DATAGOVERNANCE_PREFIX}/data-shield/collaboration` }
      ]
    },
    //{ type: 'divider' },
    //{ name: 'Databot', icon: Bot, path: `${DATAGOVERNANCE_PREFIX}/databot` },
    { name: 'Reports', icon: DocumentTextIcon, path: `${DATAGOVERNANCE_PREFIX}/reports`, requiresDataAuditor: true },
    //{ name: 'Import', icon: ArrowsPointingInIcon, path: `${DATAGOVERNANCE_PREFIX}/import` },
    //{ name: 'Custom Addition', icon: ArrowsPointingOutIcon, path: `${DATAGOVERNANCE_PREFIX}/custom-addition` },

    {
    name: 'MDM',
    icon: ServerStackIcon,
    expandOnly: true,
    path: `${DATAGOVERNANCE_PREFIX}/mdm`,
    subItems: [
        {
            name: 'Overview',
            subItems: [
                { name: 'Domain Management', path: `${DATAGOVERNANCE_PREFIX}/mdm/overview/domain-management` },
                { name: 'Golden Records', path: `${DATAGOVERNANCE_PREFIX}/mdm/overview/golden-records` },
                // { name: '360° Entity View', path: `${DATAGOVERNANCE_PREFIX}/mdm/overview/entity-view` },
                { name: 'Cross-Domain Links', path: `${DATAGOVERNANCE_PREFIX}/mdm/overview/cross-domain-links` },
            ]
        },
        {
            name: 'Match & Merge',
            subItems: [
                { name: 'Match Configuration', path: `${DATAGOVERNANCE_PREFIX}/mdm/match&merge/match-configuration` },
                { name: 'Survivorship Rules', path: `${DATAGOVERNANCE_PREFIX}/mdm/match&merge/survivorship-rules` },
                // { name: 'Match Jobs', path: `${DATAGOVERNANCE_PREFIX}/mdm/match&merge/match-jobs` },
                { name: 'Review Queue', path: `${DATAGOVERNANCE_PREFIX}/mdm/match&merge/review-queue` },
            ]
        },
        {
            name: 'Hierarchy Manager',
            subItems: [
                { name: 'Hierarchy Definition', path: `${DATAGOVERNANCE_PREFIX}/mdm/hierarchy-manager/hierarchy-definition` },
                { name: 'Visual Hierarchy', path: `${DATAGOVERNANCE_PREFIX}/mdm/hierarchy-manager/visual-hierarchy` },
                { name: 'Node Management', path: `${DATAGOVERNANCE_PREFIX}/mdm/hierarchy-manager/node-management` },
            ]
        },
        {
            name: 'Stewardship Console',
            subItems: [
                { name: 'My Tasks', path: `${DATAGOVERNANCE_PREFIX}/mdm/stewardship-console/my-tasks` },
                { name: 'Task Queue', path: `${DATAGOVERNANCE_PREFIX}/mdm/stewardship-console/task-queue` },
                { name: 'Review History', path: `${DATAGOVERNANCE_PREFIX}/mdm/stewardship-console/review-history` },
                { name: 'SLA Dashboard', path: `${DATAGOVERNANCE_PREFIX}/mdm/stewardship-console/sla-dashboard` },
            ]
        },
        {
            name: 'Data Sync',
            subItems: [
                { name: 'Sync Configuration', path: `${DATAGOVERNANCE_PREFIX}/mdm/data-sync/sync-configuration` },
                { name: 'Sync Monitor', path: `${DATAGOVERNANCE_PREFIX}/mdm/data-sync/sync-monitor` },
                { name: 'Conflict Resolution', path: `${DATAGOVERNANCE_PREFIX}/mdm/data-sync/conflict-resolution` },
                { name: 'API Gateway', path: `${DATAGOVERNANCE_PREFIX}/mdm/data-sync/api-gateway` },
            ]
        },
        { name: 'Agent Mesh',
        subItems: [
                { name: 'Agent Dashboard', path: `${DATAGOVERNANCE_PREFIX}/mdm/agent-mesh/agent-dashboard` },
                { name: 'Agent Chat (NLQ)', path: `${DATAGOVERNANCE_PREFIX}/mdm/agent-mesh/agent-chat` },
                { name: 'Agent Catalog', path: `${DATAGOVERNANCE_PREFIX}/mdm/agent-mesh/agent-catalog` },
                { name: 'Workflow Templates', path: `${DATAGOVERNANCE_PREFIX}/mdm/agent-mesh/workflow-templates` },
                { name: 'Workflow Designer', path: `${DATAGOVERNANCE_PREFIX}/mdm/agent-mesh/workflow-designer` },
                { name: 'Active Workflows', path: `${DATAGOVERNANCE_PREFIX}/mdm/agent-mesh/active-workflows` },
            ]
        },
    ]
},
  ];

  const dataGovernanceRoutes = allDataGovernanceRoutes
    .map(route => {
      if (route.requiresUserManager && !isUserManager) return null;
      if (route.requiresDataAuditor && !isDataAuditor) return null;
      if (route.subItems) {
        const filteredSubItems = route.subItems.filter(
          subItem => !subItem.requiresPolicyManager || isPolicyManager
        );
        if (filteredSubItems.length === 0 && route.path === `${DATAGOVERNANCE_PREFIX}/data-shield`) {
          return null;
        }
        return { ...route, subItems: filteredSubItems };
      }
      return route;
    })
    .filter(route => route !== null);

  const AI_PREFIX = '/ai';

  const aiRoutes = [
    { name: 'Dashboard', icon: DashboardIcon, path: `/dashboard` },
    {
      name: 'Hub',
      icon: AIHubIcon,
      path: `${AI_PREFIX}/hub/data`,
      subItems: [
        { name: 'Data', path: `${AI_PREFIX}/hub/data` },
        { name: 'Projects', path: `${AI_PREFIX}/hub/projects` },
        { name: 'Models', path: `${AI_PREFIX}/hub/models` },
      ]
    },
    { name: 'AI Playground', icon: AIPlaygroundIcon, path: `${AI_PREFIX}/playground` },
    { name: 'F1 Mode', icon: Flag, path: `${AI_PREFIX}/f1mode` },
    { name: 'Prescriptive Analysis', icon: Sparkles, path: `${AI_PREFIX}/prescriptive` },
    { name: 'Orchestration', icon: AccountTreeIcon, path: `${AI_PREFIX}/orchestration` },
    { name: 'Agent Mesh', icon: AgentMeshIcon, path: `${AI_PREFIX}/agent-mesh` },
    { name: 'Marketplace', icon: MarketplaceIcon, path: `${AI_PREFIX}/marketplace` },
    { name: 'Observability', icon: ObservabilityIcon, path: `${AI_PREFIX}/observability` },
    { type: 'divider' },
    { name: 'Collaboration', icon: CollaboratorIcon, path: `${AI_PREFIX}/collaboration` },
    { name: 'Neo Mode', icon: NeoModeIcon, path: `${AI_PREFIX}/neo-mode` },
  ];

  const currentRoutes =
    currentActiveSection === 'platform' ? platformRoutes  :
      currentActiveSection === 'ai' ? aiRoutes :
        dataGovernanceRoutes;

  const renderIcon = (IconComponent, isActive) => {
    if (typeof IconComponent === 'string') {
      // SVG file path — render as <img> with CSS filter
      return (
        <img
          src={IconComponent}
          alt=""
          className="h-5 w-5 flex-shrink-0"
          style={{ filter: isActive ? ACTIVE_FILTER : INACTIVE_FILTER }}
        />
      );
    }
    // React component icon (Heroicons / Lucide)
    return (
      <IconComponent
        className="h-5 w-5 flex-shrink-0"
        style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_ICON_COLOR }}
      />
    );
  };

  const renderNavItem = (route) => {
    if (route.type === 'divider') {
      return <div key={`divider-${Math.random()}`} className="my-2 border-t border-gray-200" />;
    }

    const hasSubItems = route.subItems && route.subItems.length > 0;
    const isExpanded = expandedItem === route.name;

    return (
      <div key={route.path}>
        <NavLink
          to={route.path}
          onClick={(e) => {
            if (route.expandOnly) {
              e.preventDefault();
              toggleExpand(e, route.name);
              return;
            }
            handleNavClick(e, route.path);
          }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${isActive ? 'bg-purple-100' : 'hover:bg-gray-100'}`
          }
        >
          {({ isActive }) => (
            <>
              {renderIcon(route.icon, isActive)}
              {!isCollapsed && (
                <>
                  <span
                    className="truncate flex-grow text-sm font-medium"
                    style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_TEXT_COLOR }}
                  >
                    {route.name}
                  </span>
                  {hasSubItems && (
                    <button
                      onClick={(e) => toggleExpand(e, route.name)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-transform duration-300"
                    >
                      <ChevronRightIcon
                        className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                        style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_ICON_COLOR }}
                      />
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </NavLink>

        {hasSubItems && !isCollapsed && (
          <div
            className={`ml-9 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="space-y-1 py-1">
              {route.subItems.map((subItem) => {
                const hasNestedSubItems = subItem.subItems && subItem.subItems.length > 0;
                const isSubExpanded = expandedSubItem === subItem.name;

                return (
                  <div key={subItem.path || subItem.name}>
                    {subItem.path ? (
                      <NavLink
                        to={subItem.path}
                        onClick={(e) => handleNavClick(e, subItem.path, subItem.name)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-purple-100' : 'hover:bg-gray-100'}`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className="text-sm"
                              style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_TEXT_COLOR }}
                            >
                              {subItem.name}
                            </span>
                            {hasNestedSubItems && (
                              <button
                                onClick={(e) => toggleSubExpand(e, subItem.name)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-transform duration-300"
                              >
                                <ChevronRightIcon
                                  className={`h-3 w-3 transition-transform duration-300 ${isSubExpanded ? 'rotate-90' : 'rotate-0'}`}
                                  style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_ICON_COLOR }}
                                />
                              </button>
                            )}
                          </>
                        )}
                      </NavLink>
                    ) : (
                      <div
                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg"
                        onClick={(e) => toggleSubExpand(e, subItem.name)}
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: INACTIVE_TEXT_COLOR }}
                        >
                          {subItem.name}
                        </span>
                        {hasNestedSubItems && (
                          <span
                            className="text-base font-light leading-none select-none"
                            style={{ color: INACTIVE_ICON_COLOR }}
                          >
                            {isSubExpanded ? '—' : '+'}
                          </span>
                        )}
                      </div>
                    )}

                    {hasNestedSubItems && (
                      <div
                        className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${isSubExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="space-y-1 py-1">
                          {subItem.subItems.map((nestedItem) => (
                            <NavLink
                              key={nestedItem.path}
                              to={nestedItem.path}
                              onClick={(e) => handleNavClick(e, nestedItem.path, nestedItem.name)}
                              className={({ isActive }) =>
                                `block px-6 py-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-purple-100' : 'hover:bg-gray-50'}`
                              }
                            >
                              {({ isActive }) => (
                                <span
                                  className="text-sm"
                                  style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_TEXT_COLOR }}
                                >
                                  {nestedItem.name}
                                </span>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className={`bg-white border-r border-gray-200 h-[calc(100vh-64px)] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} fixed flex flex-col`}
      >
        <nav className="px-2 py-2 flex-1 overflow-y-auto">
          {personasLoading ? null : currentRoutes.map(renderNavItem)}
        </nav>

        <div
          className={`mt-auto p-2 border-t border-gray-100 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}
        >
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" style={{ color: INACTIVE_ICON_COLOR }} />
            ) : (
              <PanelLeftClose className="h-5 w-5" style={{ color: INACTIVE_ICON_COLOR }} />
            )}
          </button>
        </div>
      </aside>

      {/* AI Playground Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#00000099] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div>
              <div className='p-6'>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-medium text-[#332849]">Cancel AI Playground Workflow?</h2>
                </div>
                <p className="text-base text-[#818181] mb-6">
                  Are you sure you want to cancel? All unsaved progress and configurations will be lost. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 p-3 justify-end font-satoshi border-t border-slate-200 shadow-[0_-2px_10px_0px_rgba(0,0,0,0.07)]">
                <button
                  onClick={handleCancelModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#818181] hover:bg-gray-50 transition-colors"
                >
                  Continue Working
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelLoading}
                  className="px-4 py-2 bg-[#EF4D5F] text-white rounded-lg text-sm hover:bg-red-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isCancelLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isCancelLoading ? 'Cancelling...' : 'Yes, Discard Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* F1 Mode Cancel Modal */}
      {showF1CancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Exit F1 Mode</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to leave? Your active F1 Mode session will be terminated.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleF1CancelModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Stay in F1 Mode
                </button>
                <button
                  onClick={handleF1ConfirmCancel}
                  disabled={isF1CancelLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isF1CancelLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isF1CancelLoading ? 'Ending Session...' : 'Yes, End Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;