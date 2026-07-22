import React from 'react';
import DataTable from '../../../../components/DataTable';

const PredictiveTable = ({ columns, data, isLoading, isError, refetch }) => (
  <DataTable
    columns={columns}
    data={data}
    isLoading={isLoading}
    isError={isError}
    refetch={refetch}
  />
);

export default PredictiveTable;
