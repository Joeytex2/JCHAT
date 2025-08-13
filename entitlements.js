// entitlements.js - shared helper for client-only premium/limits logic (no Firebase imports here)

// Default limits used if admin has not configured plan_limits in Firestore
export const DEFAULT_LIMITS = {
    free: {
        chatMediaMaxMB: 10,
        voiceNoteSeconds: 30,
        chatEditWindowMin: 2,
        chatDeleteWindowMin: 2,
        pinnedPerChat: 0,
        postMediaMaxMB: 10,
        groupsCreateMax: 1,
        groupMembersCap: 200,
        monthlyJCoins: 0,
        xpMultiplier: 1
    },
    starter: {
        chatMediaMaxMB: 30,
        voiceNoteSeconds: 60,
        chatEditWindowMin: 5,
        chatDeleteWindowMin: 5,
        pinnedPerChat: 1,
        postMediaMaxMB: 30,
        groupsCreateMax: 3,
        groupMembersCap: 500,
        monthlyJCoins: 300,
        xpMultiplier: 1.25
    },
    pro: {
        chatMediaMaxMB: 60,
        voiceNoteSeconds: 120,
        chatEditWindowMin: 15,
        chatDeleteWindowMin: 15,
        pinnedPerChat: 3,
        postMediaMaxMB: 60,
        groupsCreateMax: 5,
        groupMembersCap: 1000,
        monthlyJCoins: 800,
        xpMultiplier: 1.5
    },
    creator: {
        chatMediaMaxMB: 120,
        voiceNoteSeconds: 180,
        chatEditWindowMin: 30,
        chatDeleteWindowMin: 30,
        pinnedPerChat: 5,
        postMediaMaxMB: 120,
        groupsCreateMax: 10,
        groupMembersCap: 5000,
        monthlyJCoins: 1500,
        xpMultiplier: 2
    },
    business: {
        chatMediaMaxMB: 250,
        voiceNoteSeconds: 300,
        chatEditWindowMin: 60,
        chatDeleteWindowMin: 60,
        pinnedPerChat: 10,
        postMediaMaxMB: 250,
        groupsCreateMax: 25,
        groupMembersCap: 20000,
        monthlyJCoins: 4000,
        xpMultiplier: 3
    }
};

export function isPremiumActive(userProfile) {
    if (!userProfile || !userProfile.premiumStatus) return false;
    const status = userProfile.premiumStatus.status || 'inactive';
    if (status !== 'active') return false;
    const expiry = userProfile.premiumStatus.expiry;
    try {
        const expiryMs = typeof expiry?.toMillis === 'function' ? expiry.toMillis() : (expiry ? new Date(expiry).getTime() : 0);
        return expiryMs > Date.now();
    } catch (_) {
        return true; // if no expiry stored, consider active
    }
}

export function resolvePlanKey(userProfile) {
    if (!isPremiumActive(userProfile)) return 'free';
    const plan = (userProfile.premiumStatus?.plan || 'starter').toLowerCase();
    const known = ['free','starter','pro','creator','business'];
    return known.includes(plan) ? plan : 'starter';
}

// planLimitsDoc: the document data from Firestore (object with plan keys) or null
export function getPlanLimitsFor(planLimitsDoc, planKey) {
    const source = planLimitsDoc && typeof planLimitsDoc === 'object' ? planLimitsDoc : DEFAULT_LIMITS;
    const limits = source[planKey];
    if (limits && typeof limits === 'object') return limits;
    return DEFAULT_LIMITS[planKey] || DEFAULT_LIMITS.free;
}

// Safe getter with fallback
export function getLimit(planLimitsDoc, planKey, key, fallbackValue) {
    const limits = getPlanLimitsFor(planLimitsDoc, planKey);
    if (Object.prototype.hasOwnProperty.call(limits, key)) return limits[key];
    const freeFallback = getPlanLimitsFor(planLimitsDoc, 'free')[key];
    if (typeof freeFallback !== 'undefined') return freeFallback;
    return typeof fallbackValue !== 'undefined' ? fallbackValue : null;
}

// Convenience utility used by UI
export function bytesToMB(bytes) { return bytes / (1024 * 1024); }