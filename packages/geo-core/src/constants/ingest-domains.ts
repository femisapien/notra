export const GEO_PENDING_DOMAIN_LIMIT = 20;
export const GEO_PENDING_DOMAIN_TTL_SECONDS = 30 * 24 * 60 * 60;

export const GEO_RECORD_PENDING_DOMAIN_SCRIPT = `
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return 0 end
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[4])
redis.call('ZADD', KEYS[1], ARGV[2], ARGV[1])
redis.call('ZREMRANGEBYRANK', KEYS[1], 0, -tonumber(ARGV[3]) - 1)
redis.call('EXPIRE', KEYS[1], ARGV[5])
return 1
`;

export const GEO_IGNORE_PENDING_DOMAIN_SCRIPT = `
redis.call('SADD', KEYS[2], ARGV[1])
redis.call('ZREM', KEYS[1], ARGV[1])
return 1
`;
