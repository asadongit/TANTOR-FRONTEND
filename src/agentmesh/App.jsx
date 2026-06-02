// NOTE: This file is NOT used as an entry point when AgentMesh runs inside Tantor.
// The AgentMeshWrapper (src/pages/AI/AgentMesh/AgentMeshWrapper.jsx) imports
// MainComponent directly. This file is kept only for reference / standalone mode.
import MainComponent from './components/Apps/AgentMeshModules/MainComponent';

export default function App() {
  return <MainComponent />;
}
