import { Route } from 'react-router-dom';
import DataCatalogue from './DataCatalogue';
import Database from './Database';


const PREFIX = '/data-catalogue';

export const DataCatalogueRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<DataCatalogue />} />
    <Route path={`${PREFIX}/database`} element={<Database />} />
  </>
);
