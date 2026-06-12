import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MeetingDetail from './pages/MeetingDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="meetings/:id" element={<MeetingDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
