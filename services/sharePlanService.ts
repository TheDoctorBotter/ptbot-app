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
  description?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  difficulty?: string;
  sets?: number;
  reps?: number;
  holdSeconds?: number;
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
   * Generate HTML for PDF export
   */
  generatePrintHtml(payload: SharePlanPayload): string {
    const exerciseListHtml = payload.exercises
      .map(
        (ex, index) => `
        <div class="exercise">
          <div class="exercise-number">${index + 1}</div>
          <div class="exercise-content">
            <h3 class="exercise-title">${ex.title}</h3>
            ${ex.description ? `<p class="exercise-description">${ex.description}</p>` : ''}
            <div class="exercise-dosage">
              ${ex.sets ? `<span>Sets: ${ex.sets}</span>` : ''}
              ${ex.reps ? `<span>Reps: ${ex.reps}</span>` : ''}
              ${ex.holdSeconds ? `<span>Hold: ${ex.holdSeconds}s</span>` : ''}
            </div>
            ${ex.youtubeUrl ? `<p class="exercise-link">Video: <a href="${ex.youtubeUrl}">${ex.youtubeUrl}</a></p>` : ''}
          </div>
        </div>
      `
      )
      .join('');

    const precautionsHtml = payload.precautions
      .map(
        (p) => `
        <div class="precaution ${p.severity}">
          <h4>${p.title}</h4>
          <ul>
            ${p.bullets.map((b) => `<li>${b}</li>`).join('')}
          </ul>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${payload.planTitle} - ${payload.clinicName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #fff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            background: ${payload.primaryColor};
            color: white;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .header img {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background: white;
          }
          .header-text h1 {
            font-size: 20px;
            margin-bottom: 4px;
          }
          .header-text p {
            font-size: 14px;
            opacity: 0.9;
          }
          .plan-info {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
          }
          .plan-info h2 {
            font-size: 18px;
            margin-bottom: 8px;
          }
          .plan-meta {
            font-size: 14px;
            color: #6b7280;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            margin: 24px 0 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid ${payload.primaryColor};
          }
          .exercise {
            display: flex;
            gap: 12px;
            padding: 16px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .exercise-number {
            width: 28px;
            height: 28px;
            background: ${payload.secondaryColor};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            flex-shrink: 0;
          }
          .exercise-content {
            flex: 1;
          }
          .exercise-title {
            font-size: 15px;
            margin-bottom: 4px;
          }
          .exercise-description {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .exercise-dosage {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: #374151;
          }
          .exercise-link {
            font-size: 12px;
            color: #6b7280;
            margin-top: 8px;
          }
          .exercise-link a {
            color: ${payload.primaryColor};
          }
          .precaution {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 12px;
          }
          .precaution.warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
          }
          .precaution.info {
            background: #e0f2fe;
            border: 1px solid #0ea5e9;
          }
          .precaution h4 {
            font-size: 14px;
            margin-bottom: 8px;
          }
          .precaution ul {
            margin-left: 20px;
            font-size: 13px;
          }
          .precaution li {
            margin-bottom: 4px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
            .header {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${payload.clinicLogoUrl ? `<img src="${payload.clinicLogoUrl}" alt="Logo">` : ''}
          <div class="header-text">
            <h1>${payload.clinicName}</h1>
            <p>Exercise Program</p>
          </div>
        </div>

        <div class="plan-info">
          <h2>${payload.planTitle}</h2>
          <div class="plan-meta">
            ${payload.patientFirstName ? `<p>Prepared for: ${payload.patientFirstName}</p>` : ''}
            ${payload.phaseNumber ? `<p>Phase ${payload.phaseNumber}${payload.phaseName ? `: ${payload.phaseName}` : ''}</p>` : ''}
            ${payload.painLocation ? `<p>Focus Area: ${payload.painLocation}</p>` : ''}
            <p>Created: ${new Date(payload.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        ${
          payload.precautions.length > 0
            ? `
          <h3 class="section-title">Important Precautions</h3>
          ${precautionsHtml}
        `
            : ''
        }

        <h3 class="section-title">Your Exercises (${payload.exercises.length})</h3>
        ${exerciseListHtml}

        <div class="footer">
          <p>This exercise program is for educational purposes only.</p>
          <p>Always consult your healthcare provider before starting any exercise program.</p>
          <p>Generated by ${payload.clinicName} via PTBOT</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const sharePlanService = new SharePlanService();
export default sharePlanService;
