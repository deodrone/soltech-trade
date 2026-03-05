import api from '../config/api';

const REF_KEY = 'soltech_ref';

export function useReferral() {
  function captureReferral(route) {
    const ref = route.query.ref;
    if (ref && typeof ref === 'string' && /^[a-zA-Z0-9_-]{3,32}$/.test(ref)) {
      sessionStorage.setItem(REF_KEY, ref);
      // Attribute the referral visit server-side (fire-and-forget)
      api.post('/api/referral/visit', { ref }).catch(() => {});
    }
  }

  function getReferrer() {
    return sessionStorage.getItem(REF_KEY) || null;
  }

  async function getReferralLink(userId) {
    return `${window.location.origin}/?ref=${userId}`;
  }

  async function getMyReferralStats() {
    try {
      const { data } = await api.get('/api/referral/stats');
      return data;
    } catch { return { visits: 0, signups: 0, earned: 0 }; }
  }

  function buildShareText(link, context = 'trade') {
    const messages = {
      trade: `I'm trading Solana tokens on Soltech Trade — fastest DEX terminal with sniper, DCA, and smart money tracking. Join me: ${link}`,
      pnl: (pnl) => `Made ${pnl} on Solana today using Soltech Trade. Copy my trades: ${link}`,
      launch: `Just launched a token on Soltech Launchpad! The fastest way to launch on Solana: ${link}`,
    };
    return typeof messages[context] === 'function' ? messages[context] : messages[context] || messages.trade;
  }

  function shareOnTwitter(text) {
    const encoded = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank', 'width=550,height=420');
  }

  function shareOnTelegram(text) {
    const encoded = encodeURIComponent(text);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encoded}`, '_blank');
  }

  function copyLink(link) {
    return navigator.clipboard.writeText(link);
  }

  return { captureReferral, getReferrer, getReferralLink, getMyReferralStats, buildShareText, shareOnTwitter, shareOnTelegram, copyLink };
}
