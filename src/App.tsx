/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Power } from 'lucide-react';

// Declare chrome global for TypeScript
declare var chrome: any;

// Mock chrome API for development/preview mode
const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

const mockStorage = {
  get: (keys: string[] | string | object, callback: (result: any) => void) => {
    const result: any = {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(k => {
      const val = localStorage.getItem(`mock_storage_${k}`);
      result[k] = val ? JSON.parse(val) : undefined;
    });
    setTimeout(() => callback(result), 0);
  },
  set: (items: object, callback?: () => void) => {
    Object.entries(items).forEach(([k, v]) => {
      localStorage.setItem(`mock_storage_${k}`, JSON.stringify(v));
    });
    if (callback) setTimeout(callback, 0);
  }
};

const mockTabs = {
  query: (queryInfo: any, callback: (result: any[]) => void) => {
    setTimeout(() => callback([{ id: 123, url: 'https://example.com' }]), 0);
  }
};

const mockAlarms = {
  create: (name: string, info: any) => console.log('Mock Alarm Created:', name, info),
  clear: (name: string, callback?: (wasCleared: boolean) => void) => {
    console.log('Mock Alarm Cleared:', name);
    if (callback) callback(true);
  },
  get: (name: string, callback: (alarm: any) => void) => callback(null)
};

const chromeAPI = isExtension ? chrome : {
  storage: { local: mockStorage },
  tabs: mockTabs,
  alarms: mockAlarms
};

export default function App() {
  const [interval, setIntervalValue] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'running'>('idle');

  useEffect(() => {
    // Get current tab and its refresh status
    chromeAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        setCurrentTabId(tabId);
        
        chromeAPI.storage.local.get([`tab_${tabId}_active`, `tab_${tabId}_interval`], (result) => {
          if (result[`tab_${tabId}_active`]) {
            setIsActive(true);
            setStatus('running');
          }
          if (result[`tab_${tabId}_interval`]) {
            setIntervalValue(result[`tab_${tabId}_interval`]);
          }
        });
      }
    });
  }, []);

  const toggleRefresh = () => {
    if (!currentTabId) return;

    const newState = !isActive;
    setIsActive(newState);
    setStatus(newState ? 'running' : 'idle');

    if (newState) {
      // Start refreshing
      chromeAPI.alarms.create(`refresh_tab_${currentTabId}`, {
        periodInMinutes: interval / 60,
        delayInMinutes: interval / 60
      });
      chromeAPI.storage.local.set({
        [`tab_${currentTabId}_active`]: true,
        [`tab_${currentTabId}_interval`]: interval
      });
    } else {
      // Stop refreshing
      chromeAPI.alarms.clear(`refresh_tab_${currentTabId}`);
      chromeAPI.storage.local.set({
        [`tab_${currentTabId}_active`]: false
      });
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setIntervalValue(value);
    
    // If already active, update the alarm
    if (isActive && currentTabId) {
      chromeAPI.alarms.create(`refresh_tab_${currentTabId}`, {
        periodInMinutes: value / 60,
        delayInMinutes: value / 60
      });
      chromeAPI.storage.local.set({
        [`tab_${currentTabId}_interval`]: value
      });
    }
  };

  return (
    <div className="w-[320px] min-h-[340px] bg-[#0F172A] text-white p-6 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg shadow-lg transition-colors duration-300 ${isActive ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
            <RefreshCw className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">AutoRefresher</h1>
        </div>
      </header>

      {/* Main Control */}
      <main className="space-y-8">
        <section className="text-center">
          <div className="relative inline-block">
            <button
              onClick={toggleRefresh}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? 'bg-green-600 shadow-[0_0_30px_rgba(34,197,94,0.3)]' 
                  : 'bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
              }`}
            >
              <Power className="w-10 h-10 text-white" />
            </button>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">
            {isActive ? 'Status: Active' : 'Status: Inactive'}
          </p>
        </section>

        {/* Settings */}
        <section className="bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">Interval</span>
            </div>
            <span className="text-xl font-mono font-bold text-blue-400">
              {interval}s
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={interval}
              onChange={handleIntervalChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>10s</span>
              <span>2m</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
