const CACHE_TTL_MS = Math.max(
  5_000,
  Number(process.env.AUTH_USER_CACHE_TTL_MS || 45_000) || 45_000
);

/** Cache curto em memória por instância (serverless-friendly). */
const userCache = new Map();

function getCachedUser(userId) {
  const key = Number(userId);
  const hit = userCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    userCache.delete(key);
    return null;
  }
  return hit.user;
}

function setCachedUser(user) {
  if (!user?.id) return;
  userCache.set(Number(user.id), {
    user,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function invalidateCachedUser(userId) {
  userCache.delete(Number(userId));
}

module.exports = {
  CACHE_TTL_MS,
  getCachedUser,
  setCachedUser,
  invalidateCachedUser,
};
