import { Route } from 'react-router-dom';
import DataCatalogue from './DataCatalogue';
import Database from './Database';
import Schema from './Schema';
import Tables from './Tables';
import Columns from './Columns';
import TableDetailsPage from './TableDetailsPage';


const PREFIX = '/datagovernance/data-catalogue';

export const DataCatalogueRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<DataCatalogue />} />
    <Route path={`${PREFIX}/database`} element={<Database />} />
    <Route path={`${PREFIX}/schema`} element={<Schema />} />
    <Route path={`${PREFIX}/table`} element={<Tables />} />
    <Route path={`${PREFIX}/column`} element={<Columns />} />
    <Route path={`${PREFIX}/table/:tableName`} element={<TableDetailsPage />} />
  </>
);
