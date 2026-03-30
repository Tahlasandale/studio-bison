import { useEffect } from 'preact/hooks';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { NavigationBar } from './components/NavigationBar';
import { DatabasePanel } from './components/DatabasePanel';
import { MenuEditor } from './components/MenuEditor';
import { SettingsEditor } from './components/SettingsEditor';
import { pages, currentPage, loadPages, isLoading } from './stores/editor';
import { loadSettings } from './stores/settings';
import { currentRoute, initRouter, routeReady } from './lib/router';
import './index.css';

export function App() {
  useEffect(() => {
    initRouter();
    loadPages();
    loadSettings();
  }, []);

  if (!routeReady.value) {
    return (
      <div class="flex items-center justify-center h-screen text-[var(--text)]">
        Loading...
      </div>
    );
  }

  return (
    <div class="flex flex-col h-screen bg-[var(--bg)]">
      <NavigationBar />
      
      <div class="flex flex-1 overflow-hidden min-w-0">
        {currentRoute.value === 'database' ? (
          <div class="flex-1 min-w-0">
            <DatabasePanel />
          </div>
        ) : currentRoute.value === 'menu' ? (
          <MenuEditor />
        ) : currentRoute.value === 'settings' ? (
          <SettingsEditor />
        ) : (
          <>
            <Sidebar pages={pages.value} />
            <div class="flex-1">
              {isLoading.value ? (
                <div class="flex items-center justify-center h-screen text-[var(--text)]">
                  Loading...
                </div>
              ) : currentPage.value ? (
                <Canvas page={currentPage.value} />
              ) : (
                <div class="flex flex-col items-center justify-center h-screen text-[var(--text)]">
                  <p class="mb-4">No page selected</p>
                  <p class="text-sm text-[var(--text)]/50">Create a new page to get started</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}