import React from 'react';

const Observability = () => {
  // Use the Local Nginx Proxy (Port 8080) that strips iFrame blocking headers
  const langfuseUrl = "http://localhost:3000";

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col">
      <iframe
        id="langfuse-iframe"
        src={langfuseUrl}
        className="w-full h-full border-0"
        title="Langfuse Dashboard"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
      />

      {/* 
          💡 NOTE: If you are still seeing connection issues, ensure 
          you have run 'docker compose up -d' in the langfuse-setup folder.
      */}
    </div>
  );
};

export default Observability;
