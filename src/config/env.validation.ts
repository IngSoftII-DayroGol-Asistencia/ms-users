import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().required().messages({
    'string.empty': 'DATABASE_URL es requerido',
    'any.required': 'DATABASE_URL es requerido',
  }),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().required().messages({
    'string.empty': 'JWT_ACCESS_SECRET es requerido',
  }),
  JWT_REFRESH_SECRET: Joi.string().required().messages({
    'string.empty': 'JWT_REFRESH_SECRET es requerido',
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(15).default(10),
});
