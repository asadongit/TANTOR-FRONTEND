import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useDomains, useConnections } from '../../../../../hooks/mdm/processingCenter';
import { useAuth } from '../../../../../context/AuthContext';

const RequiredLabel = ({ children }) => (
  <label className="text-sm font-medium text-[#332849] flex items-center gap-0.5">
    {children}
    <span className="text-red-500 ml-0.5">*</span>
  </label>
);

const RunScopeDrawer = ({ open, onClose, onApply, pipelineMode, engines, customEnabled, singleSelected, resetSignal }) => {
  const { decodedToken } = useAuth();
  const username = decodedToken?.preferred_username;

  const activeEngines = engines.filter((e) => {
    if (pipelineMode === 'Full Pipeline') return true;
    if (pipelineMode === 'Custom Selection') return !!customEnabled[e.id];
    if (pipelineMode === 'Single Engine') return singleSelected === e.id;
    return false;
  });

  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const connectionRef = useRef(null);

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainOpen, setDomainOpen] = useState(false);
  const domainRef = useRef(null);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const recordRef = useRef(null);

  const { domains, isLoading: domainsLoading } = useDomains({ enabled: open });
  const { connections, isLoading: connectionsLoading } = useConnections(username, { enabled: open });

  const recordOptions = ['Incremental', 'DQ Flagged', 'All Staged'];

  const allSelected = selectedConnection && selectedDomain && selectedRecord;

  useEffect(() => {
    if (resetSignal !== undefined) {
      setSelectedConnection(null);
      setSelectedDomain(null);
      setSelectedRecord(null);
    }
  }, [resetSignal]);

  useEffect(() => {
    const handler = (e) => {
      if (connectionRef.current && !connectionRef.current.contains(e.target)) setConnectionOpen(false);
      if (domainRef.current && !domainRef.current.contains(e.target)) setDomainOpen(false);
      if (recordRef.current && !recordRef.current.contains(e.target)) setRecordOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setConnectionOpen(false);
      setDomainOpen(false);
      setRecordOpen(false);
    }
  }, [open]);

  const renderDropdown = ({ ref, label, isLoading, selected, setSelected, open, setOpen, options, placeholder }) => (
    <div className="space-y-1.5" ref={ref}>
      <RequiredLabel>{label}</RequiredLabel>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 h-10 border border-[#CCCCCC] rounded-lg bg-white hover:border-[#8E77BB] transition-colors"
        >
          <span className={`text-sm ${selected ? 'text-[#332849]' : 'text-[#818181]'}`}>
            {isLoading ? 'Loading...' : (selected ?? placeholder)}
          </span>
          <ChevronDown
            size={16}
            className={`text-[#818181] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#CCCCCC] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#818181]">No options found</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setSelected(opt); setOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#332849] hover:bg-[#F2EBFF] transition-colors text-left"
                >
                  <span>{opt}</span>
                  {selected === opt && <Check size={14} className="text-[#8E77BB] shrink-0" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  const handleClose = () => {
    setSelectedConnection(null);
    setSelectedDomain(null);
    setSelectedRecord(null);
    onClose();
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40" />}

      <div
        className={`fixed top-0 right-0 h-full w-[493px] bg-white shadow-[-8px_0_10px_rgba(0,0,0,0.1)] z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[72px] border-b border-[#CCCCCC] shrink-0">
          <span className="text-[#282F49] font-medium text-lg">Run Scope</span>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {renderDropdown({
            ref: connectionRef,
            label: 'Connection',
            isLoading: connectionsLoading,
            selected: selectedConnection,
            setSelected: setSelectedConnection,
            open: connectionOpen,
            setOpen: setConnectionOpen,
            options: connections,
            placeholder: 'Select Connections',
          })}
          {renderDropdown({
            ref: domainRef,
            label: 'Domain',
            isLoading: domainsLoading,
            selected: selectedDomain,
            setSelected: setSelectedDomain,
            open: domainOpen,
            setOpen: setDomainOpen,
            options: domains,
            placeholder: 'Select domain',
          })}
          {renderDropdown({
            ref: recordRef,
            label: 'Record Selection',
            isLoading: false,
            selected: selectedRecord,
            setSelected: setSelectedRecord,
            open: recordOpen,
            setOpen: setRecordOpen,
            options: recordOptions,
            placeholder: 'Select record scope',
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 h-[72px] border-t border-gray-200 shadow-[0_-4px_9px_rgba(0,0,0,0.1)] shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-[#8E77BB] text-[#8E77BB] rounded-lg text-sm font-medium hover:bg-[#F2EBFF]"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply({
              connection: selectedConnection,
              domain: selectedDomain,
              recordSelection: selectedRecord,
            })}
            disabled={!allSelected}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              allSelected
                ? 'bg-[#8E77BB] hover:bg-[#7a6aa6] cursor-pointer'
                : 'bg-[#C4B8DC] cursor-not-allowed'
            }`}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default RunScopeDrawer;