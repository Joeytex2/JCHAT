export let userCountryCode = null;
export let userCurrency = { code: 'USD', symbol: '$', label: 'USD' };

export function inferCountryCodeFromProfileOrLocale(profile) {
  try {
    const pref = localStorage.getItem('jchat-currency-preference');
    if (pref && pref !== 'AUTO') {
      return pref === 'NGN' ? 'NG' : null;
    }
    const raw = (profile?.country || '').toString().trim().toLowerCase();
    if (raw) {
      if (raw === 'ng' || raw === 'ngn' || raw === 'nigeria' || raw.includes('nigeria')) return 'NG';
    }
    const lang = navigator.language || navigator.userLanguage || '';
    const match = lang.match(/-([A-Z]{2})$/);
    if (match && match[1]) return match[1];
  } catch (_) {}
  return null;
}

export function resolveCurrencyForCountry(countryCode) {
  if (countryCode === 'NG') return { code: 'NGN', symbol: '₦', label: 'NGN' };
  return { code: 'USD', symbol: '$', label: 'USD' };
}

export function setUserCurrencyFromProfile(profile) {
  userCountryCode = inferCountryCodeFromProfileOrLocale(profile) || userCountryCode;
  userCurrency = resolveCurrencyForCountry(userCountryCode);
  return userCurrency;
}

export function formatLocalCurrency(amount) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency.code }).format(Number(amount));
  } catch (_) {
    const value = Number(amount).toFixed(2);
    return `${userCurrency.symbol}${value} ${userCurrency.label}`;
  }
}

export function applyCurrencyDisplayForWallet(jcoinPackagesGrid) {
  const amountLabel = document.querySelector('label[for="nairaInput"]');
  if (userCurrency.code === 'NGN') {
    if (amountLabel) amountLabel.textContent = 'Amount Paid (NGN):';
    const manualBuySection = document.querySelector('.manual-buy-section');
    if (manualBuySection) manualBuySection.style.display = '';
  } else {
    if (amountLabel) amountLabel.textContent = 'Amount Paid';
    const manualBuySection = document.querySelector('.manual-buy-section');
    if (manualBuySection) manualBuySection.style.display = 'none';
    if (jcoinPackagesGrid) {
      jcoinPackagesGrid.innerHTML = '<p style="text-align: center; color: var(--text-light);">Purchases are currently available in NGN for Nigerian users only.</p>';
    }
  }
}