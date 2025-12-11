import { Route } from 'react-router-dom';
import Models from './Models';
import Data from './Data';
import Projects from './Projects';

//models page routes
import Library from './Components/Models/Library/Library';


const PREFIX = '/ai/hub';

export const HubRoutes = (
  <>
    <Route path={`${PREFIX}/models`} element={<Models />} />
    <Route path={`${PREFIX}/data`} element={<Data />} />
    <Route path={`${PREFIX}/projects`} element={<Projects />} />
    <Route path={`${PREFIX}/models/library`} element={<Library />} />

  </>
);
