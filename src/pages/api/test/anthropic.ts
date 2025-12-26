import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import * as Sentry from '@sentry/cloudflare';
import { logInfo, logError, trackDistribution, trackCount } from '../../../lib/sentry';

/**
 * Test endpoint for verifying Sentry AI monitoring with Anthropic API calls
 * Visit: /api/test/anthropic to trigger a test LLM request
 *
 * This endpoint demonstrates automatic AI operation tracking using Sentry's
 * instrumentAnthropicAiClient() which captures:
 * - AI operation spans with timing
 * - Input prompts (when recordInputs: true)
 * - Output completions (when recordOutputs: true)
 * - Token usage and model information
 *
 * Requires ANTHROPIC_API_KEY environment variable
 */
export const GET: APIRoute = async ({ locals }) => {
  const startTime = Date.now();

  try {
    // Get API key from environment
    const apiKey = locals.runtime?.env?.ANTHROPIC_API_KEY;

    if (!apiKey) {
      logError('Anthropic API key not configured', {
        endpoint: '/api/test/anthropic',
        error: 'missing_api_key',
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'ANTHROPIC_API_KEY not configured in environment',
          hint: 'Add ANTHROPIC_API_KEY to your .dev.vars or wrangler.toml',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logInfo('Starting Anthropic API test', {
      endpoint: '/api/test/anthropic',
      model: 'claude-3-5-sonnet-20241022',
    });

    // Initialize Anthropic client with Sentry instrumentation
    const anthropic = new Anthropic({
      apiKey,
    });

    // Instrument the client to automatically capture AI operation spans
    const client = Sentry.instrumentAnthropicAiClient(anthropic, {
      recordInputs: true,
      recordOutputs: true,
    });

    // Make test API call
    const requestStartTime = Date.now();

    const msg = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Tell me a short joke about programming'
      }],
    });

    const requestDuration = Date.now() - requestStartTime;

    // Track metrics
    trackCount('anthropic_api_call', 1, {
      model: 'claude-3-5-sonnet-20241022',
      endpoint: '/api/test/anthropic',
      status: 'success',
    });

    trackDistribution('anthropic_api_latency', requestDuration, {
      model: 'claude-3-5-sonnet-20241022',
    });

    trackDistribution('anthropic_input_tokens', msg.usage.input_tokens, {
      model: 'claude-3-5-sonnet-20241022',
    });

    trackDistribution('anthropic_output_tokens', msg.usage.output_tokens, {
      model: 'claude-3-5-sonnet-20241022',
    });

    logInfo('Anthropic API call successful', {
      endpoint: '/api/test/anthropic',
      duration_ms: requestDuration,
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
      model: msg.model,
    });

    const totalDuration = Date.now() - startTime;

    // Extract the joke from the response
    const joke = msg.content[0].type === 'text' ? msg.content[0].text : '';

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Anthropic API test completed successfully',
        joke,
        metrics: {
          total_duration_ms: totalDuration,
          api_latency_ms: requestDuration,
          input_tokens: msg.usage.input_tokens,
          output_tokens: msg.usage.output_tokens,
          model: msg.model,
        },
        sentry_tracking: {
          metrics_sent: [
            'anthropic_api_call (counter)',
            'anthropic_api_latency (distribution)',
            'anthropic_input_tokens (distribution)',
            'anthropic_output_tokens (distribution)',
          ],
          logs_sent: [
            'Anthropic API test started (info)',
            'Anthropic API call successful (info)',
          ],
        },
        next_steps: [
          '1. Check Sentry dashboard → Performance section for AI operation spans',
          '2. Look for traces showing anthropic.messages.create operations',
          '3. Check Metrics section for: anthropic_api_call, anthropic_api_latency',
          '4. Check Logs section for structured log entries',
          '5. Verify input/output prompts are captured in span data',
          '6. Verify token usage metrics are tracked',
        ],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorDuration = Date.now() - startTime;

    // Track error metrics
    trackCount('anthropic_api_call', 1, {
      endpoint: '/api/test/anthropic',
      status: 'error',
    });

    logError('Anthropic API test failed', {
      endpoint: '/api/test/anthropic',
      duration_ms: errorDuration,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_type: error instanceof Error ? error.constructor.name : 'unknown',
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: errorDuration,
        sentry_tracking: {
          error_logged: true,
          metrics_sent: ['anthropic_api_call (counter with status=error)'],
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
