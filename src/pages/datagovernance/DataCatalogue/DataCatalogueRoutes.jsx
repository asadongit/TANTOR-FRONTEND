import { Route } from 'react-router-dom';
import DataCatalogue from './DataCatalogue';
import Database from './Database/Database';
import Schema from './Schema/Schema';
import Tables from './Tables';
import Columns from './Columns';
import TableDetailsPage from './TableDetailsPage';
import ColumnDetailsPage from './ColumnDetailsPage';
import SchemaViewScreen from './Schema/SchemaViewScreen';
import DatabaseViewScreen from './Database/DatabaseViewScreen';


const PREFIX = '/datagovernance/data-catalogue';

export const DataCatalogueRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<DataCatalogue />} />
    <Route path={`${PREFIX}/database`} element={<Database />} />
    <Route path={`${PREFIX}/database/:connectionName`} element={<DatabaseViewScreen />} />
    <Route path={`${PREFIX}/schema`} element={<Schema />} />
    <Route path={`${PREFIX}/schema/:schemaName`} element={<SchemaViewScreen />}/>
    <Route path={`${PREFIX}/table`} element={<Tables />} />
    <Route path={`${PREFIX}/column`} element={<Columns />} />
    <Route path={`${PREFIX}/table/:tableName`} element={<TableDetailsPage />} />
    <Route path={`${PREFIX}/column/:columnName`} element={<ColumnDetailsPage />} />
  </>
);
