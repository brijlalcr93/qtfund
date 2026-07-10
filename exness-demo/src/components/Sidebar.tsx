import React from 'react';
import { LayoutDashboard, BarChart2, History, Settings, User } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-icon">
        <LayoutDashboard size={20} />
      </div>
      <div className="sidebar-icon active">
        <BarChart2 size={20} />
      </div>
      <div className="sidebar-icon">
        <History size={20} />
      </div>
      <div style={{ flex: 1 }} />
      <div className="sidebar-icon">
        <User size={20} />
      </div>
      <div className="sidebar-icon">
        <Settings size={20} />
      </div>
    </div>
  );
};
