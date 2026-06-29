import { createContext, useContext, useRef, useState, ReactNode } from 'react';

interface SidebarContextValue {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  sidebarRef: React.MutableRefObject<any>;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
  sidebarRef: { current: null },
  toggleSidebar: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef<any>(null);

  const toggleSidebar = () => {
    const panel = sidebarRef.current;
    if (panel) {
      if (panel.isCollapsed()) panel.expand();
      else panel.collapse();
    }
  };

  return (
    <SidebarContext.Provider value={{ isSidebarCollapsed, setIsSidebarCollapsed, sidebarRef, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
