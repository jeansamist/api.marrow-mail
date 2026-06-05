import { ApiResponse } from '#utils/api_response'
import { errors as authErrors } from '@adonisjs/auth'
import { errors } from '@adonisjs/core'
import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors as vineErrors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status codes to ignore from being reported
   */
  protected ignoreStatuses = [400, 401, 403, 404, 422, 429]

  /**
   * Error codes to ignore from being reported
   */
  protected ignoreCodes = [
    'E_ROUTE_NOT_FOUND',
    'E_ROW_NOT_FOUND',
    'E_AUTHORIZATION_FAILURE',
    'E_TOO_MANY_REQUESTS',
    'E_BAD_CSRF_TOKEN',
    'E_UNAUTHORIZED_ACCESS',
    'E_INVALID_CREDENTIALS',
    'E_VALIDATION_ERROR',
  ]

  /**
   * Exception classes to ignore from being reported
   */
  protected ignoreExceptions = [
    errors.E_ROUTE_NOT_FOUND,
    lucidErrors.E_ROW_NOT_FOUND,
    authErrors.E_UNAUTHORIZED_ACCESS,
    authErrors.E_INVALID_CREDENTIALS,
    vineErrors.E_VALIDATION_ERROR,
  ]

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // ===========================================
    // VALIDATION ERRORS (VineJS)
    // ===========================================
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      const msg =
        Array.isArray(error.messages) &&
        error.messages.map((e: { message: string }) => e.message).join(', ')

      return ctx.response
        .status(422)
        .send(ApiResponse.failure(error.messages, 'Validation failed. ' + msg))
    }

    // ===========================================
    // DATABASE ERRORS (Lucid ORM)
    // ===========================================
    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      return ctx.response.status(404).send(ApiResponse.failure(null, 'Resource not found.'))
    }

    // ===========================================
    // CORE FRAMEWORK ERRORS
    // ===========================================

    // Route Errors
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.response
        .status(404)
        .send(ApiResponse.failure(null, 'The requested endpoint does not exist.'))
    }

    if (error instanceof errors.E_CANNOT_LOOKUP_ROUTE) {
      return ctx.response
        .status(500)
        .send(ApiResponse.failure(null, 'Unable to generate URL for the specified route.'))
    }

    // HTTP Errors
    if (error instanceof errors.E_HTTP_EXCEPTION) {
      return ctx.response
        .status(error.status)
        .send(
          ApiResponse.failure(
            error.body,
            error.message || 'An error occurred processing your request.'
          )
        )
    }

    if (error instanceof errors.E_HTTP_REQUEST_ABORTED) {
      return ctx.response
        .status(error.status)
        .send(ApiResponse.failure(null, 'Request was aborted.'))
    }

    if (error instanceof errors.E_INVALID_ENV_VARIABLES) {
      return ctx.response
        .status(500)
        .send(
          ApiResponse.failure(this.debug ? error.help : null, 'Environment configuration error.')
        )
    }

    // Command/CLI Errors
    if (error instanceof errors.E_MISSING_COMMAND_NAME) {
      return ctx.response
        .status(500)
        .send(ApiResponse.failure(null, 'Command configuration error: missing command name.'))
    }

    if (error instanceof errors.E_COMMAND_NOT_FOUND) {
      return ctx.response
        .status(404)
        .send(ApiResponse.failure(null, 'Requested operation not found.'))
    }

    if (error instanceof errors.E_MISSING_FLAG) {
      return ctx.response
        .status(400)
        .send(ApiResponse.failure(null, 'Required parameter is missing.'))
    }

    if (error instanceof errors.E_MISSING_FLAG_VALUE) {
      return ctx.response
        .status(400)
        .send(ApiResponse.failure(null, 'Parameter value is required.'))
    }

    if (error instanceof errors.E_MISSING_ARG) {
      return ctx.response
        .status(400)
        .send(ApiResponse.failure(null, 'Required argument is missing.'))
    }

    if (error instanceof errors.E_MISSING_ARG_VALUE) {
      return ctx.response.status(400).send(ApiResponse.failure(null, 'Argument value is required.'))
    }

    if (error instanceof errors.E_UNKNOWN_FLAG) {
      return ctx.response.status(400).send(ApiResponse.failure(null, 'Unknown parameter provided.'))
    }

    if (error instanceof errors.E_INVALID_FLAG) {
      return ctx.response
        .status(400)
        .send(ApiResponse.failure(null, 'Invalid parameter value provided.'))
    }

    // ===========================================
    // AUTHENTICATION & AUTHORIZATION ERRORS
    // ===========================================

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return ctx.response
        .status(401)
        .send(
          ApiResponse.failure(
            null,
            'Authentication required. Please log in to access this resource.'
          )
        )
    }

    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return ctx.response
        .status(400)
        .send(
          ApiResponse.failure(
            null,
            'Invalid credentials provided. Please check your login details.'
          )
        )
    }

    // ===========================================
    // GENERIC ERROR HANDLING
    // ===========================================

    // Handle any Error instance
    if (error instanceof Error) {
      // Check if it's an HTTP error with status
      const httpError = error as any
      if (httpError.status && typeof httpError.status === 'number') {
        return ctx.response.status(httpError.status).send(
          ApiResponse.failure(
            this.debug
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : null,
            httpError.message || 'An error occurred.'
          )
        )
      }

      // Generic server error
      return ctx.response.status(500).send(
        ApiResponse.failure(
          this.debug
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : null,
          'An unexpected error occurred.'
        )
      )
    }

    // Handle non-Error objects
    if (typeof error === 'object' && error !== null) {
      return ctx.response
        .status(500)
        .send(ApiResponse.failure(this.debug ? error : null, 'An unexpected error occurred.'))
    }

    // Handle primitive values
    return ctx.response
      .status(500)
      .send(
        ApiResponse.failure(
          this.debug ? { error: String(error) } : null,
          'An unexpected error occurred.'
        )
      )
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  /**
   * Add custom context to error logs
   */
  protected context(ctx: HttpContext) {
    return {
      requestId: ctx.request.id(),
      userId: ctx.auth?.user?.id,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      url: ctx.request.url(),
      method: ctx.request.method(),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Custom shouldReport method for fine-grained control
   */
  protected shouldReport(error: any): boolean {
    // Don't report validation errors and other client errors
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return false
    }

    // Don't report common client errors
    if (error instanceof errors.E_ROUTE_NOT_FOUND || error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      return false
    }

    // Report everything else
    return super.shouldReport(error)
  }
}
