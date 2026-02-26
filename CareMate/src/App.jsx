import { Routes, Route, Navigate } from "react-router-dom";
import AddMedic from "./pages/AddMedic";
import Schedule from "./pages/Schedule";
import Dashboard from "./pages/Dashboard";
import Today from "./pages/Today";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/today" />} />
      <Route path="/today" element={<Today />} />
      <Route path="/add" element={<AddMedic />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;