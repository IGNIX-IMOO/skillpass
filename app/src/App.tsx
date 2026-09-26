import { useEffect, useState } from "react";
import { AppShell, type ViewKey } from "./components/AppShell";
import { PUBLIC_BUILD } from "./config";
import { useRegistry } from "./hooks/useRegistry";
import { Overview } from "./pages/Overview";
import { OwnershipDemo } from "./pages/OwnershipDemo";
import { PublicDemo } from "./pages/PublicDemo";
import { PublicOverview } from "./pages/PublicOverview";
import { PublicVerify } from "./pages/PublicVerify";
import {
  LicensesPage,
  PassportsPage,
  ReceiptsPage,
  RightsPage,
  ServicesPage,
} from "./pages/RegistryPages";

const VIEW_KEYS: ViewKey[] = [
  "demo",
  "ownership",
  "verify",
  "overview",
  "passports",
  "licenses",
  "services",
  "receipts",
  "rights",
];

function readHash(): ViewKey {
  const value = window.location.hash.replace(/^#\/?/, "");
  if (VIEW_KEYS.includes(value as ViewKey)) return value as ViewKey;
  // the published bundle has no registry bridge, so the console pages would
  // open empty; send those visitors to the read-only demo instead
  return "overview";
}

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>(readHash);
  const registryApi = useRegistry();

  useEffect(() => {
    const onHashChange = () => setActiveView(readHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectView = (view: ViewKey) => {
    window.location.hash = `/${view}`;
    setActiveView(view);
  };

  return (
    <AppShell activeView={activeView} onSelect={selectView}>
      {activeView === "demo" && (
        <PublicDemo registryApi={registryApi} onSelect={selectView} />
      )}
      {activeView === "ownership" && (
        <OwnershipDemo registryApi={registryApi} onSelect={selectView} />
      )}
      {activeView === "verify" && <PublicVerify />}
      {activeView === "overview" && (
        PUBLIC_BUILD
          ? <PublicOverview onSelect={selectView} />
          : <Overview api={registryApi} />
      )}
      {activeView === "passports" && (
        <PassportsPage
          registry={registryApi.registry}
          onCreate={registryApi.createPassport}
        />
      )}
      {activeView === "licenses" && (
        <LicensesPage
          registry={registryApi.registry}
          onIssue={registryApi.issueLicense}
          onRevoke={registryApi.revokeLicense}
        />
      )}
      {activeView === "services" && (
        <ServicesPage
          registry={registryApi.registry}
          onToggle={registryApi.toggleService}
        />
      )}
      {activeView === "receipts" && (
        <ReceiptsPage registry={registryApi.registry} />
      )}
      {activeView === "rights" && (
        <RightsPage
          registry={registryApi.registry}
          canReset={registryApi.source === "local"}
          onReset={registryApi.reset}
        />
      )}
    </AppShell>
  );
}
