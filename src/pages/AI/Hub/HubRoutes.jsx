import { Route } from 'react-router-dom';
import Models from './Models';
import Data from './Data';


const PREFIX = '/ai/hub';

export const HubRoutes = (
  <>
    <Route path={`${PREFIX}/models`} element={<Models />} />
    <Route path={`${PREFIX}/data`} element={<Data />} />

  </>
);
