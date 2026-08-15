import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/cors'

/**
 * Origins allowed to call the API from a browser, read from the
 * comma-separated CORS_ORIGIN environment variable.
 */
const allowedOrigins = env
  .get('CORS_ORIGIN', '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * In development, allow every origin to simplify local front/backend setup.
   * In production, use the CORS_ORIGIN allowlist — which stays empty, blocking
   * all cross-origin browser access, until the variable is configured.
   */
  origin: app.inDev ? true : allowedOrigins,

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
