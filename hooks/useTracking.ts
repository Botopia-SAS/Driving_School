'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

function generateSessionId() {
  return Math.random().toString(36).substring(7);
}

export const useTracking = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id || 'anonymous';
  const startTime = useRef(Date.now());
  const lastPage = useRef<string>(pathname);
  const lastReferrer = useRef<string>('');
  const sessionStarted = useRef(false);
  const lastUserId = useRef<string>(userId);
  const lastEvent = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const THROTTLE_DELAY = 1000; // 1 segundo para mousemove
  let lastEventTime = 0;
  let closeTimeout: NodeJS.Timeout | null = null;
  let sessionClosed = false;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  // Detectar si la navegación es un reload
  let isReload = false;
  if (typeof window !== 'undefined') {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    isReload = nav?.type === 'reload';
  }

  // Obtener o mantener sessionId según el usuario
  function getOrKeepSessionId() {
    if (typeof window !== 'undefined') {
      const storedUserId = window.sessionStorage.getItem('userId');
      let sessionId = window.sessionStorage.getItem('sessionId');
      if (!sessionId || storedUserId !== userId) {
        sessionId = generateSessionId();
        window.sessionStorage.setItem('sessionId', sessionId);
        window.sessionStorage.setItem('userId', userId);
      }
      return sessionId;
    }
    return generateSessionId();
  }

  let SESSION_ID = getOrKeepSessionId();

  // Tracking profesional de sesión
  // duration: tiempo en la página anterior antes de navegar
  const trackSession = async (endSession = false, referrerOverride?: string) => {
    if (endSession && sessionClosed) return; // No cerrar dos veces
    if (endSession) sessionClosed = true;
    const duration = Date.now() - startTime.current;
    const referrer = (referrerOverride ?? lastReferrer.current) || '';
    const payload = {
      userId,
      sessionId: SESSION_ID,
      page: window.location.href,
      referrer,
      duration,
      endSession,
      timestamp: new Date().toISOString(),
    };
    try {
      if (endSession && navigator.sendBeacon) {
        navigator.sendBeacon('/api/session-track', JSON.stringify(payload));
      } else {
        await fetch('/api/session-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (error) {
      // Silenciar errores en producción
    }
  };

  // Heartbeat: mantener la sesión activa
  const sendHeartbeat = async () => {
    try {
      await fetch('/api/session-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: SESSION_ID }),
      });
    } catch (error) {
      // Silenciar errores en producción
    }
  };

  // Tracking de heatmap: clic, movimiento, scroll
  const trackHeatmapEvent = async (
    eventType: 'click' | 'move' | 'scroll',
    x: number,
    y: number,
    element?: Element
  ) => {
    try {
      await fetch('/api/heatmap-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: SESSION_ID,
          pageUrl: window.location.href,
          eventType,
          x,
          y,
          elementId: element?.id,
          elementClass: element?.className,
          elementTag: element?.tagName,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // Silenciar errores en producción
    }
  };

  useEffect(() => {
    // Si el usuario cambia (login/logout), reiniciar la sesión
    if (lastUserId.current !== userId) {
      window.sessionStorage.removeItem('sessionId');
      window.sessionStorage.removeItem('userId');
      SESSION_ID = getOrKeepSessionId();
      sessionStarted.current = false;
      lastUserId.current = userId;
      startTime.current = Date.now();
      lastPage.current = pathname;
      lastReferrer.current = '';
      sessionClosed = false;
    }
    // Al cargar la primera vez, crear la sesión
    if (!sessionStarted.current) {
      trackSession(false, document.referrer || '');
      sessionStarted.current = true;
    } else if (lastPage.current !== pathname) {
      // Al cambiar de página, agregar página a la sesión
      trackSession(false, lastPage.current || '');
      startTime.current = Date.now();
      lastReferrer.current = lastPage.current || '';
      lastPage.current = pathname;
    }

    // Heartbeat: enviar ping cada 10 segundos
    heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 10000);

    // --- SOLO cerrar sesión si realmente se cierra la pestaña ---
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Esperar 1.5 segundos para ver si es un refresco
        closeTimeout = setTimeout(() => {
          if (!isReload) {
            trackSession(true, lastPage.current || '');
          }
        }, 1500);
      } else if (document.visibilityState === 'visible') {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          closeTimeout = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Respaldo: beforeunload para asegurar cierre de sesión
    const handleBeforeUnload = () => {
      if (!isReload) {
        trackSession(true, lastPage.current || '');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Eventos de heatmap
    const handleClick = (e: MouseEvent) => {
      trackHeatmapEvent('click', e.clientX, e.clientY, e.target as Element);
    };
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const now = Date.now();
      if (
        now - lastEventTime > THROTTLE_DELAY &&
        (Math.abs(clientX - lastEvent.current.x) > 10 || Math.abs(clientY - lastEvent.current.y) > 10)
      ) {
        lastEvent.current = { x: clientX, y: clientY };
        lastEventTime = now;
        trackHeatmapEvent('move', clientX, clientY);
      }
    };
    const handleScroll = () => {
      trackHeatmapEvent('scroll', window.scrollX, window.scrollY);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (closeTimeout) clearTimeout(closeTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line
  }, [pathname, userId]);
}; 