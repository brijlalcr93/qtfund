import React from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Chart } from './components/Chart';
import { OrderPanel } from './components/OrderPanel';
import { PositionsPanel } from './components/PositionsPanel';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="workspace">
          <div className="chart-area">
            <Chart />
            <PositionsPanel />
          </div>
          <OrderPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
