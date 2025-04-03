import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Salesforce from "./pages/Salesforce";
import SalesTraining from "./pages/SalesTraining";
import SalesStrategy from "./pages/SalesStrategy";
import RevenueOperations from "./pages/RevenueOperations";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/salesforce" element={<Salesforce />} />
        <Route path="/sales-training" element={<SalesTraining />} />
        <Route path="/sales-strategy" element={<SalesStrategy />} />
        <Route path="/revenue-operations" element={<RevenueOperations />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
