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
   * Uses two-column layout for 6+ exercises to fit on single page
   */
  generatePrintHtml(payload: SharePlanPayload): string {
    const exerciseCount = payload.exercises.length;
    const useTwoColumns = exerciseCount >= 6;

    // Build exercise items
    const exerciseItems = payload.exercises.map((ex, index) => {
      const dosage = this.formatDosage(ex);
      const description = this.truncateText(ex.description, 80);
      const videoId = ex.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
      const shortVideoUrl = videoId ? `youtu.be/${videoId}` : '';
      const safetyHtml = ex.safetyNotes && ex.safetyNotes.length > 0
        ? `<div class="exercise-safety">${ex.safetyNotes.slice(0, 2).map(n => this.truncateText(n, 60)).join(' • ')}</div>`
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

    // Build precautions (compact, max 2 bullets each)
    const precautionsHtml = payload.precautions.length > 0 ? `
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>PTBOT Exercise Plan</title>
        <style>
          @page {
            size: letter;
            margin: 0.4in;
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
            font-size: 10px;
            line-height: 1.3;
            color: #1a1a1a;
            background: #fff;
          }
          .page {
            width: 100%;
            max-width: 7.5in;
            margin: 0 auto;
            padding: 0.3in;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            border-bottom: 2px solid ${payload.primaryColor};
            margin-bottom: 12px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .clinic-logo {
            width: 36px;
            height: 36px;
            border-radius: 6px;
            object-fit: cover;
          }
          .header-title {
            font-size: 18px;
            font-weight: 700;
            color: ${payload.primaryColor};
          }
          .header-subtitle {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }
          .header-right {
            text-align: right;
            font-size: 9px;
            color: #666;
          }
          .header-date {
            font-weight: 600;
            color: #333;
          }

          /* Plan Context */
          .plan-context {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
          }
          .plan-title {
            font-size: 13px;
            font-weight: 600;
            color: #1a1a1a;
          }
          .plan-meta {
            font-size: 9px;
            color: #666;
            margin-top: 3px;
          }

          /* Precautions */
          .precautions-section {
            background: #fff8e6;
            border: 1px solid #f0c36d;
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 12px;
          }
          .section-label {
            font-size: 10px;
            font-weight: 700;
            color: #8a6d3b;
            margin-bottom: 4px;
          }
          .precautions-list {
            font-size: 9px;
            color: #5a4a2a;
          }
          .precaution-item {
            margin-bottom: 3px;
          }

          /* Exercises Section */
          .exercises-header {
            font-size: 12px;
            font-weight: 700;
            color: ${payload.primaryColor};
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e0e0e0;
          }

          /* Exercise Grid - Two Column */
          .exercises-grid {
            display: ${useTwoColumns ? 'grid' : 'block'};
            grid-template-columns: ${useTwoColumns ? '1fr 1fr' : '1fr'};
            gap: ${useTwoColumns ? '8px 16px' : '6px'};
          }

          /* Exercise Item */
          .exercise-item {
            display: flex;
            gap: 8px;
            padding: 6px 0;
            border-bottom: 1px solid #eee;
            page-break-inside: avoid;
          }
          .exercise-num {
            width: 20px;
            height: 20px;
            background: ${payload.primaryColor};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .exercise-details {
            flex: 1;
            min-width: 0;
          }
          .exercise-name {
            font-size: 11px;
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.2;
          }
          .exercise-dosage {
            font-size: 10px;
            color: ${payload.primaryColor};
            font-weight: 600;
            margin-top: 2px;
          }
          .exercise-why {
            font-size: 9px;
            color: #666;
            margin-top: 2px;
            line-height: 1.25;
          }
          .exercise-video {
            font-size: 8px;
            color: #0066cc;
            margin-top: 2px;
          }
          .exercise-safety {
            font-size: 8px;
            color: #b45309;
            margin-top: 2px;
            font-style: italic;
          }

          /* Footer */
          .footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 8px;
            color: #999;
          }
          .footer-disclaimer {
            margin-bottom: 3px;
          }
          .footer-branding {
            color: #666;
          }

          /* Print Specific */
          @media print {
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page {
              padding: 0;
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
              <div class="header-date">Generated: ${new Date(payload.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
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
          <div class="exercises-header">Your Exercises (${exerciseCount})</div>
          <div class="exercises-grid">
            ${exerciseItems}
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-disclaimer">This exercise program is for educational purposes. Consult your healthcare provider before starting.</div>
            <div class="footer-branding">Generated by ${payload.clinicName} via PTBOT</div>
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
