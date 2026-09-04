'use client';

import { useEffect } from 'react';

/**
 * DatabaseKeepAlive
 * Pings /api/db/status every 30 seconds in the background
 * to prevent PostgreSQL Hostgator / Supabase connections from idling/hibernating,
 * without rendering any UI elements in the navigation bar.
 */
export function DatabaseKeepAlive() {
  useEffect(() => {
    // Initial silent ping after 5 seconds to warm up
    const initialTimer = setTimeout(() => {
      fetch('/api/db/status').catch(() => {});
    }, 5000);

    // Keep-alive every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/db/status').catch(() => {});
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return null;
}
