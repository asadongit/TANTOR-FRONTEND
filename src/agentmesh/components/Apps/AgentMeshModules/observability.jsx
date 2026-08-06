import React from 'react';

const Observability = () => {
  // Configured Langfuse server URL
  const langfuseUrl = import.meta.env.VITE_LANGFUSE_HOST || "http://192.168.3.89:30300";

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col">
      {/* Top Bar for seamless access */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Langfuse Observability</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{langfuseUrl}</span>
        </div>
        <a
          href={langfuseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
        >
          <span>Open Full Dashboard ↗</span>
        </a>
      </div>

      {/* Embedded Langfuse Dashboard */}
      <iframe
        id="langfuse-iframe"
        src={langfuseUrl}
        className="w-full flex-1 border-0"
        title="Langfuse Dashboard"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      />
    </div>
  );
};

export default Observability;
