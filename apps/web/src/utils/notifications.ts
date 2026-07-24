/**
 * PWA push notification utility
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    const opts: Record<string, any> = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options,
    };
    // vibrate may not be in TS types but is supported in browsers
    if ('vibrate' in navigator) {
      opts.vibrate = [200, 100, 200];
    }
    new Notification(title, opts);
  }
}

export function scheduleDrawReminder() {
  const now = new Date();
  const target = new Date();
  target.setUTCHours(13, 0, 0, 0); // 21:00 Beijing = 13:00 UTC
  if (target <= now) target.setDate(target.getDate() + 1);
  
  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    sendNotification('Quantum8 开奖提醒', {
      body: '快乐八即将开奖，快来看看今日分析！',
      tag: 'draw-reminder',
    });
  }, delay);
}

export function checkPickHits(drawNumbers: number[]) {
  try {
    const picks = JSON.parse(localStorage.getItem('quantum8_picks') || '[]');
    const hits: { pick: any; matchCount: number; matched: number[] }[] = [];
    
    picks.forEach((pick: any) => {
      if (!pick.numbers) return;
      const matched = pick.numbers.filter((n: number) => drawNumbers.includes(n));
      if (matched.length >= 3) {
        hits.push({ pick, matchCount: matched.length, matched });
      }
    });

    if (hits.length > 0) {
      const best = hits.sort((a, b) => b.matchCount - a.matchCount)[0];
      sendNotification('命中提醒', {
        body: '你的选号命中了 ' + best.matchCount + ' 个号码！',
        tag: 'pick-hit',
      });
    }
  } catch {}
}
