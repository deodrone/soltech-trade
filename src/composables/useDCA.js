import axios from 'axios';

// Jupiter DCA API
const DCA_API = 'https://dca-api.jup.ag';

export function useDCA() {
  // Get open DCA accounts for a wallet
  async function getDCAOrders(wallet) {
    try {
      const { data } = await axios.get(`${DCA_API}/dca/wallet/${wallet}`);
      return data?.dcaAccounts || [];
    } catch { return []; }
  }

  // Create a DCA order — returns the transaction to sign
  async function createDCATransaction({
    userPublicKey,
    inputMint,
    outputMint,
    totalInAmount,   // total lamports to spend
    inAmountPerCycle, // lamports per cycle
    cycleSecondsApart, // seconds between each cycle (e.g. 3600 = hourly)
    minOutAmountPerCycle = 0,
    maxOutAmountPerCycle = 0,
    startAt = null, // unix timestamp or null for immediate
  }) {
    try {
      const body = {
        userPublicKey,
        inputMint,
        outputMint,
        totalInAmount: totalInAmount.toString(),
        inAmountPerCycle: inAmountPerCycle.toString(),
        cycleSecondsApart,
        minOutAmountPerCycle: minOutAmountPerCycle.toString(),
        maxOutAmountPerCycle: maxOutAmountPerCycle.toString(),
      };
      if (startAt) body.startAt = startAt;
      const { data } = await axios.post(`${DCA_API}/dca`, body);
      return data; // { tx, dcaAddress }
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message);
    }
  }

  // Close/cancel a DCA account
  async function closeDCATransaction({ userPublicKey, dcaAddress }) {
    try {
      const { data } = await axios.post(`${DCA_API}/dca/close`, { userPublicKey, dcaAddress });
      return data; // { tx }
    } catch (e) {
      throw new Error(e.response?.data?.message || e.message);
    }
  }

  // Human-friendly cycle label
  function cycleLabel(secs) {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${secs / 60}m`;
    if (secs < 86400) return `${secs / 3600}h`;
    return `${secs / 86400}d`;
  }

  const CYCLE_OPTIONS = [
    { label: '1 min',   value: 60 },
    { label: '5 min',   value: 300 },
    { label: '1 hour',  value: 3600 },
    { label: '4 hours', value: 14400 },
    { label: '12 hours',value: 43200 },
    { label: '1 day',   value: 86400 },
    { label: '1 week',  value: 604800 },
  ];

  return { getDCAOrders, createDCATransaction, closeDCATransaction, cycleLabel, CYCLE_OPTIONS };
}
