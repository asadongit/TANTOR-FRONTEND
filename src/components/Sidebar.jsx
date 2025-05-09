import { NavLink } from 'react-router-dom';
import { useState } from 'react';
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

const Sidebar = ({ activeSection, isCollapsed, toggleSidebar }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (e, routeName) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [routeName]: !prev[routeName]
    }));
  };

  const platformRoutes = [
    { name: 'Dashboard', icon: ChartBarIcon, path: '/dashboard' },
    { name: 'Project', icon: CubeIcon, path: '/project' },
    { name: 'Connections', icon: LinkIcon, path: '/connections' },
    { name: 'Jobs', icon: BriefcaseIcon, path: '/jobs' },
    { name: 'Pipeline', icon: ArrowPathIcon, path: '/pipeline' },
    { name: 'Reports', icon: DocumentTextIcon, path: '/report' },
    {
      name: 'Configuration',
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

  const dataGovernanceRoutes = [
    { name: 'Dashboard', icon: ChartBarIcon, path: '/dashboard' },
    {
      name: 'User',
      icon: UserIcon,
      path: '/user',
      subItems: [
        { name: 'Role', path: '/user/role' },
        { name: 'Group', path: '/user/group' },
        { name: 'Sub-group', path: '/user/sub-group' },
        { name: 'Persona', path: '/user/persona' },
      ]
    },
    { name: 'Data Catalogue', icon: BookOpenIcon, path: '/data-catalogue', subItems: [
      { name: 'Database', path: '/data-catalogue/database' },
      { name: 'Schema', path: '/data-catalogue/schema' },
      { name: 'Table', path: '/data-catalogue/table' },
      { name: 'Column', path: '/data-catalogue/column' },
      { name: 'View', path: '/data-catalogue/view' },

    ] },
    { name: 'Data Assurance', icon: ShieldCheckIcon, path: '/data-assurance' },
    { name: 'Business Catalogue', icon: ClipboardDocumentListIcon, path: '/business-catalogue' },
    { name: 'Data Shield', icon: ShieldCheckIcon, path: '/data-shield' },
    { type: 'divider' },
    { name: 'Databot', icon: ShieldCheckIcon, path: '/databot' },
    { name: 'Reports', icon: DocumentTextIcon, path: '/reports' },
    { name: 'Import', icon: ArrowsPointingInIcon, path: '/import' },
    { name: 'Custom Addition', icon: ArrowsPointingOutIcon, path: '/custom-addition' },
  ];

  const currentRoutes = activeSection === 'platform' ? platformRoutes : dataGovernanceRoutes;

  const renderNavItem = (route) => {
    if (route.type === 'divider') {
      return <div key={`divider-${route.name}`} className="my-2 border-t border-gray-200" />;
    }

    const hasSubItems = route.subItems && route.subItems.length > 0;
    const isExpanded = expandedItems[route.name];

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
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </>
          )}
        </NavLink>

        {hasSubItems && isExpanded && !isCollapsed && (
          <div className="ml-9 space-y-1">
            {route.subItems.map((subItem) => (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`
                }
              >
                {subItem.name}
              </NavLink>
            ))}
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