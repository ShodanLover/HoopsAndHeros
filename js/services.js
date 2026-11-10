/* Basketball Empire — platform services: purchases, ads, haptics.
 *
 * Integration: a native wrapper (Capacitor/Cordova/TWA) can define window.BEPlatform before the game loads:
 *   window.BEPlatform = {
 *     purchase: async (sku) => ({ ok: true, receipt }),     // real store purchase
 *     showRewardedAd: async (placement) => ({ ok: true }),   // resolves ok only when the reward was earned
 *     showInterstitial: async () => {},
 *     getPrices: async () => ({ sku: '$1.99', ... })         // localized prices
 *   }
 * Without it the game runs in DEVELOPMENT MODE: purchases and ads are clearly labeled test substitutes and
 * no money is ever charged.
 */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});

  const platform = root.BEPlatform && typeof root.BEPlatform === 'object' ? root.BEPlatform : null;
  const services = {
    devMode: !platform,
    prices: {},

    async init() {
      if (platform && platform.getPrices) {
        try { this.prices = (await platform.getPrices()) || {}; } catch (e) { console.warn('Price lookup failed', e); }
      }
    },
    price(product) { return this.prices[product.sku] || product.price; },

    // Returns {ok, dev} — UI must confirm with the player before calling this
    async purchase(product) {
      if (platform && platform.purchase) {
        try {
          const r = await platform.purchase(product.sku);
          return { ok: !!(r && r.ok), dev: false, error: r && r.error };
        } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
      }
      // Development substitute: grants items without charging. Clearly labeled in the UI.
      await new Promise((r) => setTimeout(r, 450));
      return { ok: true, dev: true };
    },

    async rewardedAd(placement) {
      if (platform && platform.showRewardedAd) {
        try { const r = await platform.showRewardedAd(placement); return { ok: !!(r && r.ok), dev: false }; }
        catch (e) { return { ok: false, error: String(e) }; }
      }
      const ok = await BE.ui.devAd('rewarded', placement);
      return { ok, dev: true };
    },

    async interstitial() {
      if (platform && platform.showInterstitial) { try { await platform.showInterstitial(); } catch (e) { /* ad failures never block play */ } return; }
      await BE.ui.devAd('interstitial');
    },

    haptic(ms) {
      try { if (BE.game_state && BE.game_state.settings.haptics && root.navigator && navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) { /* unsupported */ }
    },
  };

  BE.services = services;
})(typeof window !== 'undefined' ? window : globalThis);
