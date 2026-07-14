import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Markets = lazy(() => import("./pages/Markets"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const AlertsPage = lazy(() => import("./pages/Alerts"));

function PageLoader() {
  return (
    <div className="h-64 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/markets" element={<Suspense fallback={<PageLoader />}><Markets /></Suspense>} />
        <Route path="/portfolio" element={<Suspense fallback={<PageLoader />}><Portfolio /></Suspense>} />
        <Route path="/asset/:symbol" element={<Suspense fallback={<PageLoader />}><AssetDetail /></Suspense>} />
        <Route path="/alerts" element={<Suspense fallback={<PageLoader />}><AlertsPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
