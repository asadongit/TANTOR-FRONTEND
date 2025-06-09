import { Route } from 'react-router-dom';
import DataAssurance from './DataAssurance';

//quality
import Rules from './Quality/Rules/Rules';
import Data from './Quality/Data/Data';
import Metadata from './Quality/Metadata/Metadata';

//l
import Lineage from './Lineage/Lineage';

const PREFIX = '/datagovernance/data-assurance';

export const DataAssuranceRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<DataAssurance />} />
    <Route path={`${PREFIX}/rules`} element={<Rules />} />
    <Route path={`${PREFIX}/data`} element={<Data />} />
    <Route path={`${PREFIX}/metadata`} element={<Metadata />} />

    <Route path={`${PREFIX}/lineage`} element={<Lineage />} />
  </>
);
