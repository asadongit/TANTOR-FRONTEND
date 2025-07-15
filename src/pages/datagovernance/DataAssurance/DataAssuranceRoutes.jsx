import { Route } from 'react-router-dom';
import DataAssurance from './DataAssurance';

//quality
import Rules from './Quality/Rules/Rules';
import CreateRules from './Quality/Rules/CreateRules/CreateRules';
import Data from './Quality/Data/Data';
import Metadata from './Quality/Metadata/Metadata';

//l
import Lineage from './Lineage/Lineage';
import RulesLibrary from './Quality/Rules/RulesLibrary';

const PREFIX = '/datagovernance/data-assurance';

export const DataAssuranceRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<DataAssurance />} />
    <Route path={`${PREFIX}/rules`} element={<Rules />} />
    <Route path={`${PREFIX}/rules/create`} element={<CreateRules />} />
    <Route path={`${PREFIX}/data`} element={<Data />} />
    <Route path={`${PREFIX}/metadata`} element={<Metadata />} />
    <Route path={`${PREFIX}/rule-library`} element={<RulesLibrary />} />


    <Route path={`${PREFIX}/lineage`} element={<Lineage />} />
  </>
);
