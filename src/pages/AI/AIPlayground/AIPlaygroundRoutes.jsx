import { Route } from 'react-router-dom';
import AIPlaygroundDashboard from './AIPlaygroundDashboard';
import DataPreprocessing from './Stages/DataPreprocessing/DataPreprocessing';
import ModelGenesis from './Stages/ModelGenesis';
import ModelSelection from './Stages/ModelSelection/ModelSelection';
import ModelInferencing from './Stages/ModelInferencing/ModelInferencing';
import XAI from './Stages/XAI';
import ModelDeployment from './Stages/ModelDeployment';
import NotebookMode from './Stages/NotebookMode';

const PREFIX = '/ai/playground';

export const AIPlaygroundRoutes = (
  <>
    <Route path={`${PREFIX}`} element={<AIPlaygroundDashboard />} />
    <Route path={`${PREFIX}/model-genesis`} element={<ModelGenesis />} />
    <Route path={`${PREFIX}/data-preprocessing`} element={<DataPreprocessing />} />
    <Route path={`${PREFIX}/model-selection`} element={<ModelSelection />} />
    <Route path={`${PREFIX}/model-inferencing`} element={<ModelInferencing />} />
    <Route path={`${PREFIX}/xai`} element={<XAI />} />
    <Route path={`${PREFIX}/model-deployment`} element={<ModelDeployment />} />
    <Route path={`${PREFIX}/notebook`} element={<NotebookMode />} />
  </>
);
