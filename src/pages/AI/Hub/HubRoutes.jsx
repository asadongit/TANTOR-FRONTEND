// HubRoutes.jsx
import { Route } from 'react-router-dom';
import Models from './Models';
import Data from './Data';
import Projects from './Projects';
import ProjectLibrary from './Components/Project/ProjectLibrary';
//models page routes
import Library from './Components/Models/Library/Library';
import DataLibrary from './Components/Data/DataLibrary';


const PREFIX = '/ai/hub';

export const HubRoutes = (
  <>
    <Route path={`${PREFIX}/models`} element={<Models />} />
    <Route path={`${PREFIX}/data`} element={<Data />} />
    <Route path={`${PREFIX}/data/library/:projectId`} element={<DataLibrary />} />
    <Route path={`${PREFIX}/projects`} element={<Projects />} />
    <Route path={`${PREFIX}/projects/:projectId/library`} element={<ProjectLibrary />} />
    <Route path={`${PREFIX}/models/library`} element={<Library />} />

  </>
);