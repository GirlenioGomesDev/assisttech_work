const buckets = new Map();

const getClientKey = (req, keyPrefix) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.ip || req.socket?.remoteAddress || 'unknown');
  return `${keyPrefix}:${ip.split(',')[0].trim()}`;
};

const rateLimit = ({ windowMs = 60_000, max = 60, keyPrefix = 'global', message = 'Muitas requisicoes. Tente novamente em instantes.' } = {}) => (
  (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ erro: message, retryAfter });
    }

    return next();
  }
);

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();

module.exports = rateLimit;
