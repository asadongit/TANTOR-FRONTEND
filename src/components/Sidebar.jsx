import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bot } from "lucide-react";
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
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeSection, isCollapsed, toggleSidebar }) => {
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedSubItem, setExpandedSubItem] = useState(null);
  const [currentActiveSection, setCurrentActiveSection] = useState(activeSection);
  const { decodedToken } = useAuth();

  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection && ['platform', 'datagovernance', 'ai'].includes(savedSection)) {
      setCurrentActiveSection(savedSection);
    } else {
      setCurrentActiveSection(activeSection);
    }
  }, [activeSection]);

  const isGlobalAdmin = decodedToken?.resource_access?.darch?.roles?.some(role => role.toLowerCase() === 'global-admin');
  const isPolicyManager = decodedToken?.resource_access?.darch?.roles?.some(role => role.toLowerCase() === 'persona:policy manager');
  const isUserManager = decodedToken?.resource_access?.darch?.roles?.some(role => role.toLowerCase() === 'persona:user manager');

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

  const platformRoutes = [
    { name: 'Dashboard', icon: ChartBarIcon, path: '/dashboard' },
    { name: 'Project', icon: CubeIcon, path: '/project' },
    { name: 'Connections', icon: LinkIcon, path: '/connections' },
    { name: 'Jobs', icon: BriefcaseIcon, path: '/jobs' },
    { name: 'Pipeline', icon: ArrowPathIcon, path: '/pipeline' },
    { name: 'Reports', icon: DocumentTextIcon, path: '/report' },
    {
      name: 'Business Reports',
      icon: ArrowPathIcon,
      path: '/config/rule',
      subItems: [
        { name: 'Rules Configuration', path: '/config/rule' },
        { name: 'Reports Configuration', path: '/config/report' },
      ]
    },
    { type: 'divider' },
    { name: 'Migration', icon: ArrowsUpDownIcon, path: '/migration' },
    { name: 'Transformation', icon: ArrowsRightLeftIcon, path: '/transformation' },
    { name: 'Purge', icon: TrashIcon, path: '/purge' },
    { name: 'CDC', icon: ServerStackIcon, path: '/cdc' },
    { name: 'Federation', icon: ShareIcon, path: '/federation' },
  ];

  const DATAGOVERNANCE_PREFIX = '/datagovernance';

  const allDataGovernanceRoutes = [
    { name: 'Dashboard', icon: ChartBarIcon, path: '/dashboard' },
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
    { name: 'Data Catalogue', icon: BookOpenIcon, path: `${DATAGOVERNANCE_PREFIX}/data-catalogue`,
      subItems: [
        { name: 'Database', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/database` },
        { name: 'Schema', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/schema` },
        { name: 'Table', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/table` },
        { name: 'Column', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/column` },
        { name: 'View', path: `${DATAGOVERNANCE_PREFIX}/data-catalogue/view` },
      ]
    },
    { name: 'Data Assurance', icon: ShieldCheckIcon, path: `${DATAGOVERNANCE_PREFIX}/data-assurance`,
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
    { name: 'Business Catalogue', icon: ClipboardDocumentListIcon, path: `${DATAGOVERNANCE_PREFIX}/business-catalogue`,
      subItems: [
        { name: 'Glossary', path: `${DATAGOVERNANCE_PREFIX}/business-catalogue/glossary` },
      ]
    },
    { name: 'Data Shield', icon: ShieldCheckIcon, path: `${DATAGOVERNANCE_PREFIX}/data-shield`,
      subItems: [
        { name: 'Protection', path: `${DATAGOVERNANCE_PREFIX}/data-shield/protection` },
        { name: 'Policy', path: `${DATAGOVERNANCE_PREFIX}/data-shield/policy`, requiresPolicyManager: true },
        { name: 'Collaboration', path: `${DATAGOVERNANCE_PREFIX}/data-shield/collaboration` }
      ]
    },
    { type: 'divider' },
    { name: 'Databot', icon: Bot, path: `${DATAGOVERNANCE_PREFIX}/databot` },
    { name: 'Reports', icon: DocumentTextIcon, path: `${DATAGOVERNANCE_PREFIX}/reports` },
    { name: 'Import', icon: ArrowsPointingInIcon, path: `${DATAGOVERNANCE_PREFIX}/import` },
    { name: 'Custom Addition', icon: ArrowsPointingOutIcon, path: `${DATAGOVERNANCE_PREFIX}/custom-addition` },
  ];

  const dataGovernanceRoutes = allDataGovernanceRoutes
    .map(route => {
      if (route.requiresUserManager && !isUserManager) return null;
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

  const currentRoutes = currentActiveSection === 'platform' ? platformRoutes : dataGovernanceRoutes;

  const renderNavItem = (route) => {
    if (route.type === 'divider') {
      return <div key={`divider-${route.name}`} className="my-2 border-t border-gray-200" />;
    }

    const hasSubItems = route.subItems && route.subItems.length > 0;
    const isExpanded = expandedItem === route.name;

    return (
      <div key={route.path}>
        <NavLink
          to={route.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${
              isActive
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <route.icon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate flex-grow">{route.name}</span>
              {hasSubItems && (
                <button
                  onClick={(e) => toggleExpand(e, route.name)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-transform duration-300"
                >
                  <ChevronRightIcon
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isExpanded ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                </button>
              )}
            </>
          )}
        </NavLink>

        {hasSubItems && !isCollapsed && (
          <div
            className={`ml-9 overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
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
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 ${
                            isActive
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`
                        }
                      >
                        <span>{subItem.name}</span>
                        {hasNestedSubItems && (
                          <button
                            onClick={(e) => toggleSubExpand(e, subItem.name)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-transform duration-300"
                          >
                            <ChevronRightIcon
                              className={`h-3 w-3 transition-transform duration-300 ${
                                isSubExpanded ? 'rotate-90' : 'rotate-0'
                              }`}
                            />
                          </button>
                        )}
                      </NavLink>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2 text-gray-500 font-medium">
                        <span>{subItem.name}</span>
                        {hasNestedSubItems && (
                          <button
                            onClick={(e) => toggleSubExpand(e, subItem.name)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-transform duration-300"
                          >
                            <ChevronRightIcon
                              className={`h-3 w-3 transition-transform duration-300 ${
                                isSubExpanded ? 'rotate-90' : 'rotate-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    )}

                    {hasNestedSubItems && (
                      <div
                        className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                          isSubExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="space-y-1 py-1">
                          {subItem.subItems.map((nestedItem) => (
                            <NavLink
                              key={nestedItem.path}
                              to={nestedItem.path}
                              className={({ isActive }) =>
                                `block px-6 py-2 rounded-lg transition-colors duration-200 ${
                                  isActive
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                }`
                              }
                            >
                              {nestedItem.name}
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
    <aside
      className={`bg-white border-r border-gray-200 h-[calc(100vh-64px)] transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } fixed`}
    >
      <div className="flex justify-end p-2">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {isCollapsed ? (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          ) : (
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="px-2">
        {currentRoutes.map(renderNavItem)}
      </nav>
    </aside>
  );
};

export default Sidebar;