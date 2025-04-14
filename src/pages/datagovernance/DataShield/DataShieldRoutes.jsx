import { Route } from 'react-router-dom';
import DataShield from './DataShield';
import Protection from './Protection';
import Policy from './Policy';
import Collaboration from './Collaboration';
import DPDP from './dpdp'


const PREFIX = '/data-shield';

export const DataShieldRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<DataShield />} />
    <Route path={`${PREFIX}/protection`} element={<Protection />} />
    <Route path={`${PREFIX}/policy`} element={<Policy />} />
    <Route path={`${PREFIX}/collaboration`} element={<Collaboration />} />
    <Route path={`${PREFIX}/protection/DPDP`} element={<DPDP />} />
  </>
);
