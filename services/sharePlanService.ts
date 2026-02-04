/**
 * Share Plan Service
 *
 * Handles creating shareable plan links and PDF export functionality.
 */

import { supabase } from '@/lib/supabase';
import { activityService } from '@/services/activityService';
import type { ClinicBranding } from '@/hooks/useClinicBranding';
import type { Precaution } from '@/components/shared/PrecautionsCard';

export interface PlanExercise {
  id: string;
  title: string;
  description?: string;  // "Why this helps" reasoning
  youtubeUrl?: string;
  thumbnailUrl?: string;
  difficulty?: string;
  sets?: number;
  reps?: number;
  holdSeconds?: number;
  frequency?: string;     // e.g., "2x/day", "Daily"
  safetyNotes?: string[]; // Max 2 bullet points
}

export interface SharePlanPayload {
  // Clinic branding
  clinicId: string | null;
  clinicName: string;
  clinicLogoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;

  // Plan info
  planTitle: string;
  planType: 'protocol' | 'symptom';
  protocolKey: string | null;
  phaseNumber: number | null;
  phaseName: string | null;
  painLocation: string | null;

  // Patient info (optional, anonymized)
  patientFirstName: string | null;

  // Exercises
  exercises: PlanExercise[];

  // Precautions
  precautions: Precaution[];

  // Metadata
  createdAt: string;
  assessmentDate: string | null;
}

export interface ShareResult {
  success: boolean;
  token?: string;
  shareUrl?: string;
  error?: string;
}

class SharePlanService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback
    this.baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://ptbot.app';
  }

  /**
   * Generate a unique share token
   */
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a shareable plan link
   */
  async createShareLink(payload: SharePlanPayload): Promise<ShareResult> {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Generate token
      const token = this.generateToken();

      // Create share record
      const { error } = await supabase
        .from('plan_shares')
        .insert({
          token,
          user_id: user?.id || null,
          payload,
          expires_at: null, // No expiration for now
        });

      if (error) {
        console.error('[SharePlanService] Error creating share:', error);
        return { success: false, error: 'Failed to create share link' };
      }

      const shareUrl = `${this.baseUrl}/share/${token}`;

      // Log activity
      await activityService.logEvent('plan_shared', {
        plan_title: payload.planTitle,
        protocol_key: payload.protocolKey,
        exercise_count: payload.exercises.length,
      });

      return {
        success: true,
        token,
        shareUrl,
      };
    } catch (err) {
      console.error('[SharePlanService] Unexpected error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get a shared plan by token
   */
  async getSharedPlan(token: string): Promise<SharePlanPayload | null> {
    if (!supabase || !token) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('plan_shares')
        .select('payload, expires_at')
        .eq('token', token)
        .single();

      if (error || !data) {
        console.error('[SharePlanService] Error fetching shared plan:', error);
        return null;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Increment view count (fire and forget)
      supabase.rpc('increment_plan_share_views', { share_token: token });

      return data.payload as SharePlanPayload;
    } catch (err) {
      console.error('[SharePlanService] Unexpected error:', err);
      return null;
    }
  }

  /**
   * Build share payload from current plan data
   */
  buildSharePayload(
    branding: ClinicBranding,
    planTitle: string,
    planType: 'protocol' | 'symptom',
    protocolKey: string | null,
    phaseNumber: number | null,
    phaseName: string | null,
    painLocation: string | null,
    patientFirstName: string | null,
    exercises: PlanExercise[],
    precautions: Precaution[],
    assessmentDate: string | null
  ): SharePlanPayload {
    return {
      clinicId: branding.clinicId,
      clinicName: branding.clinicName,
      clinicLogoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      planTitle,
      planType,
      protocolKey,
      phaseNumber,
      phaseName,
      painLocation,
      patientFirstName,
      exercises,
      precautions,
      createdAt: new Date().toISOString(),
      assessmentDate,
    };
  }

  /**
   * Truncate text to max length with ellipsis
   */
  private truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format dosage string from exercise data
   */
  private formatDosage(ex: PlanExercise): string {
    const parts: string[] = [];
    if (ex.sets && ex.reps) {
      parts.push(`${ex.sets} × ${ex.reps}`);
    } else if (ex.sets) {
      parts.push(`${ex.sets} sets`);
    } else if (ex.reps) {
      parts.push(`${ex.reps} reps`);
    }
    if (ex.holdSeconds) {
      parts.push(`${ex.holdSeconds}s hold`);
    }
    if (ex.frequency) {
      parts.push(ex.frequency);
    }
    return parts.join(' • ') || '—';
  }

  /**
   * Generate HTML for PDF export - ONE PAGE, ALL EXERCISES
   * Uses dynamic sizing and two-column layout to fit on single page
   */
  generatePrintHtml(payload: SharePlanPayload): string {
    const exerciseCount = payload.exercises.length;

    // Dynamic layout: 2 columns for 6+, 3 columns for 12+
    const useThreeColumns = exerciseCount >= 12;
    const useTwoColumns = exerciseCount >= 6 && !useThreeColumns;

    // Dynamic font sizing based on exercise count
    const baseFontSize = exerciseCount > 10 ? '8px' : exerciseCount > 6 ? '9px' : '10px';
    const exerciseNameSize = exerciseCount > 10 ? '9px' : exerciseCount > 6 ? '10px' : '11px';
    const headerTitleSize = exerciseCount > 10 ? '14px' : '16px';

    // Reduce description length for many exercises
    const descMaxLen = exerciseCount > 10 ? 50 : exerciseCount > 6 ? 65 : 80;

    // Build exercise items
    const exerciseItems = payload.exercises.map((ex, index) => {
      const dosage = this.formatDosage(ex);
      const description = this.truncateText(ex.description, descMaxLen);
      const videoId = ex.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
      const shortVideoUrl = videoId ? `youtu.be/${videoId}` : '';
      // Skip safety notes for very long lists to save space
      const safetyHtml = exerciseCount <= 8 && ex.safetyNotes && ex.safetyNotes.length > 0
        ? `<div class="exercise-safety">${ex.safetyNotes.slice(0, 1).map(n => this.truncateText(n, 40)).join('')}</div>`
        : '';

      return `
        <div class="exercise-item">
          <div class="exercise-num">${index + 1}</div>
          <div class="exercise-details">
            <div class="exercise-name">${ex.title}</div>
            <div class="exercise-dosage">${dosage}</div>
            ${description ? `<div class="exercise-why">${description}</div>` : ''}
            ${safetyHtml}
            ${shortVideoUrl ? `<div class="exercise-video">${shortVideoUrl}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Build precautions (compact, max 2 bullets each) - skip for many exercises
    const precautionsHtml = exerciseCount <= 8 && payload.precautions.length > 0 ? `
      <div class="precautions-section">
        <div class="section-label">Safety Notes</div>
        <div class="precautions-list">
          ${payload.precautions.slice(0, 2).map(p => `
            <div class="precaution-item">
              <strong>${p.title}:</strong> ${p.bullets.slice(0, 2).join(' • ')}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Context line (protocol/phase or condition)
    let contextLine = '';
    if (payload.protocolKey && payload.phaseNumber) {
      contextLine = `${payload.planTitle}`;
    } else if (payload.painLocation) {
      contextLine = `${payload.painLocation} Exercise Program`;
    }

    // Grid columns based on exercise count
    const gridColumns = useThreeColumns ? '1fr 1fr 1fr' : useTwoColumns ? '1fr 1fr' : '1fr';
    const gridGap = useThreeColumns ? '4px 12px' : useTwoColumns ? '6px 14px' : '4px';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PTBOT Exercise Plan</title>
        <style>
          @page {
            size: letter;
            margin: 0.3in;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: ${baseFontSize};
            line-height: 1.2;
            color: #1a1a1a;
            background: #fff;
            overflow: hidden;
          }
          .page {
            width: 100%;
            height: 100%;
            max-height: 10in;
            padding: 0.2in;
            display: flex;
            flex-direction: column;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 6px;
            border-bottom: 2px solid ${payload.primaryColor};
            margin-bottom: 8px;
            flex-shrink: 0;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .clinic-logo {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            object-fit: cover;
          }
          .header-title {
            font-size: ${headerTitleSize};
            font-weight: 700;
            color: ${payload.primaryColor};
          }
          .header-subtitle {
            font-size: 9px;
            color: #666;
            margin-top: 1px;
          }
          .header-right {
            text-align: right;
            font-size: 8px;
            color: #666;
          }
          .header-date {
            font-weight: 600;
            color: #333;
          }

          /* Plan Context */
          .plan-context {
            background: #f8f9fa;
            border-radius: 4px;
            padding: 6px 8px;
            margin-bottom: 8px;
            flex-shrink: 0;
          }
          .plan-title {
            font-size: 11px;
            font-weight: 600;
            color: #1a1a1a;
          }
          .plan-meta {
            font-size: 8px;
            color: #666;
            margin-top: 2px;
          }

          /* Precautions */
          .precautions-section {
            background: #fff8e6;
            border: 1px solid #f0c36d;
            border-radius: 4px;
            padding: 5px 8px;
            margin-bottom: 8px;
            flex-shrink: 0;
          }
          .section-label {
            font-size: 9px;
            font-weight: 700;
            color: #8a6d3b;
            margin-bottom: 2px;
          }
          .precautions-list {
            font-size: 8px;
            color: #5a4a2a;
          }
          .precaution-item {
            margin-bottom: 2px;
          }

          /* Exercises Section */
          .exercises-section {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          .exercises-header {
            font-size: 10px;
            font-weight: 700;
            color: ${payload.primaryColor};
            margin-bottom: 6px;
            padding-bottom: 3px;
            border-bottom: 1px solid #e0e0e0;
            flex-shrink: 0;
          }

          /* Exercise Grid */
          .exercises-grid {
            display: grid;
            grid-template-columns: ${gridColumns};
            gap: ${gridGap};
            flex: 1;
            align-content: start;
          }

          /* Exercise Item */
          .exercise-item {
            display: flex;
            gap: 6px;
            padding: 4px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .exercise-num {
            width: 16px;
            height: 16px;
            background: ${payload.primaryColor};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .exercise-details {
            flex: 1;
            min-width: 0;
          }
          .exercise-name {
            font-size: ${exerciseNameSize};
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.15;
          }
          .exercise-dosage {
            font-size: 9px;
            color: ${payload.primaryColor};
            font-weight: 600;
            margin-top: 1px;
          }
          .exercise-why {
            font-size: 8px;
            color: #666;
            margin-top: 1px;
            line-height: 1.2;
          }
          .exercise-video {
            font-size: 7px;
            color: #0066cc;
            margin-top: 1px;
          }
          .exercise-safety {
            font-size: 7px;
            color: #b45309;
            margin-top: 1px;
            font-style: italic;
          }

          /* Footer */
          .footer {
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 7px;
            color: #999;
            flex-shrink: 0;
          }

          /* Print Specific - Force single page */
          @media print {
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              height: 100%;
              overflow: hidden;
            }
            .page {
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              ${payload.clinicLogoUrl ? `<img src="${payload.clinicLogoUrl}" alt="" class="clinic-logo">` : ''}
              <div>
                <div class="header-title">PTBOT Exercise Plan</div>
                <div class="header-subtitle">${payload.clinicName}</div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-date">${new Date(payload.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              ${payload.patientFirstName ? `<div>For: ${payload.patientFirstName}</div>` : ''}
            </div>
          </div>

          <!-- Plan Context -->
          ${contextLine ? `
          <div class="plan-context">
            <div class="plan-title">${contextLine}</div>
            ${payload.phaseNumber ? `<div class="plan-meta">Phase ${payload.phaseNumber}${payload.phaseName ? ` — ${payload.phaseName}` : ''}</div>` : ''}
          </div>
          ` : ''}

          <!-- Precautions -->
          ${precautionsHtml}

          <!-- Exercises -->
          <div class="exercises-section">
            <div class="exercises-header">Your Exercises (${exerciseCount})</div>
            <div class="exercises-grid">
              ${exerciseItems}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            This exercise program is for educational purposes. Consult your healthcare provider before starting. | Generated via PTBOT
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate empty plan HTML when no exercises
   */
  generateEmptyPlanHtml(clinicName: string, primaryColor: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PTBOT Exercise Plan</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f8f9fa;
          }
          .message {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: ${primaryColor};
            font-size: 24px;
            margin-bottom: 12px;
          }
          p {
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="message">
          <h1>No Exercises in Plan</h1>
          <p>Complete an assessment to receive personalized exercise recommendations.</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const sharePlanService = new SharePlanService();
export default sharePlanService;
