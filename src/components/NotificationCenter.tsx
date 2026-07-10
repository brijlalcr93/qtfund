import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Users,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import type { Notification, NotificationType } from '../types';

const typeIcons: Record<NotificationType, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  PAYOUT: DollarSign,
  CHALLENGE: TrendingUp,
  KYC: ShieldCheck,
  TRADE: BarChart3,
  AFFILIATE: Users,
};

const typeColors: Record<NotificationType, string> = {
  INFO: 'var(--accent-cyan)',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  PAYOUT: '#22c55e',
  CHALLENGE: '#3b82f6',
  KYC: '#a855f7',
  TRADE: '#f59e0b',
  AFFILIATE: '#06b6d4',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid var(--glass-border)',
          borderRadius: '9999px',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 0.3s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.borderColor = 'var(--text-secondary)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: 'var(--accent-cyan)',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: 700,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px var(--accent-glow)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 380,
              maxHeight: 480,
              background: 'rgba(3, 7, 18, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            <div
              className="custom-scrollbar"
              style={{
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1.25rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                  }}
                >
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Info;
                  const color = typeColors[n.type] || 'var(--accent-cyan)';
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.85rem 1.25rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: n.isRead ? 'transparent' : 'rgba(6, 182, 212, 0.04)',
                        borderBottom: '1px solid var(--glass-border)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = n.isRead
                          ? 'transparent'
                          : 'rgba(6, 182, 212, 0.04)';
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: `${color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: color,
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: n.isRead ? 400 : 600,
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              lineHeight: 1.3,
                            }}
                          >
                            {n.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              marginTop: 1,
                              flexShrink: 0,
                            }}
                          >
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginTop: 2,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {n.message}
                        </div>
                        {n.link && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontSize: '0.72rem',
                              color: 'var(--accent-cyan)',
                              marginTop: 4,
                            }}
                          >
                            <ExternalLink size={10} />
                            View details
                          </div>
                        )}
                      </div>
                      {!n.isRead && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--accent-cyan)',
                            flexShrink: 0,
                            marginTop: 6,
                            boxShadow: '0 0 6px var(--accent-glow)',
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
