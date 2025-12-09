import { Route } from 'react-router-dom';
import Models from './Models';


const PREFIX = '/ai/hub';

export const HubRoutes = (
  <>
    <Route path={`${PREFIX}/models`} element={<Models />} />

  </>
);
