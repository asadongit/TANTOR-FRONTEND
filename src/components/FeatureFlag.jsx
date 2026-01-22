import React from 'react';

export const featureFlags = {
  SHOW_KAFKA_METRICS_IN_CDC: window._env_?.VITE_FEATURE_FLAG_SHOW_KAFKA_METRICS_IN_CDC === 'true',
};


// <FeatureFlag flag={featureFlags.SHOW_DB_CONFIG}>
// </FeatureFlag>


export const FeatureFlag = ({ flag, children }) => {
  return flag ? <>{children}</> : null;
};