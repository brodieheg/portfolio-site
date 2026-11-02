import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import About from "./pages/About";
import Home from "./pages/Home";
import Projects from "./pages/Projects";

// Old skill pages from the previous site now live as sections on /about.
const LEGACY = {
  "/salesforce": "salesforce",
  "/sales-training": "enablement",
  "/sales-strategy": "gtm-engineering",
  "/revenue-operations": "gtm-engineering",
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          {Object.entries(LEGACY).map(([path, id]) => (
            <Route key={path} path={path} element={<Navigate to={{ pathname: "/about", hash: `#${id}` }} replace />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
