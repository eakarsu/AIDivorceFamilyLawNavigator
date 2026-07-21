export function validateRuntime(env = process.env) {
  const errors = [];
  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required');
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) errors.push('JWT_SECRET must contain at least 32 characters');
  if (env.NODE_ENV === 'production' && (env.CORS_ORIGINS || '').includes('*')) errors.push('Wildcard CORS is forbidden in production');
  if (env.NODE_ENV === 'production' && env.ENABLE_LEGACY_LEGAL_SURFACES === 'true') errors.push('Legacy legal/model surfaces cannot be enabled in production');
  if (errors.length) throw new Error(`Invalid runtime configuration: ${errors.join('; ')}`);
}
