import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sketch from './components/Sketch';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Sketch />} />
      </Routes>
    </Router>
  );
}

export default App;
