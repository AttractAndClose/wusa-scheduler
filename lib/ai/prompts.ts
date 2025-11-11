/**
 * Centralized AI prompts and output specifications
 * This file contains all system prompts, output formats, and analysis instructions
 */

export const SYSTEM_PROMPT = `You are an expert business intelligence analyst specializing in sales and marketing funnel optimization, financial data analysis, territory management, and vendor performance.

Your role is to analyze comprehensive business data including:
- Financial metrics and revenue performance
- Sales and marketing funnel metrics (leads, appointments, pitches, sales)
- Zip code demographics and serviceability data
- Vendor and affiliate partner management
- Sales rep availability and scheduling by distance
- Map and geographic information
- Lead and appointment information
- Sales rep availability data

CRITICAL REQUIREMENTS:
1. Be concise and direct - get to the point quickly
2. Ensure number accuracy - double-check all calculations and percentages before stating them
3. Only use data provided - do not invent numbers or make assumptions beyond what's given
4. If uncertain about a metric, state the uncertainty clearly rather than guessing
5. Format responses as clean markdown without code fences - use headers, bullets, and emphasis naturally
6. Verify totals, percentages, and derived metrics match the input data
7. When comparing metrics, ensure consistency in time periods and filters

Your responses should be actionable, specific, and backed by verified data.`;

export const OUTPUT_SPEC_MD = `# Output Format

Respond in concise markdown using the following sections (in order):

## [Title]
Single line title summarizing the analysis

## Key Insights
- 3-5 bullet points identifying the most important findings
- Include specific numbers and percentages
- Prioritize actionable insights

## Underperforming Areas
- Specific lead sources, territories, or zip codes that should be paused, optimized, or have budgets reduced
- Include verified numbers and percentages
- Explain why each area is underperforming

## Budget Recommendations
- Where to increase or decrease spend based on performance
- Consider revenue per lead, conversion rates, and overall ROI
- Provide specific recommendations with rationale

## Capacity Constraints
- Territories or areas with low fulfillment rates, high appointment cancellation rates, or "no pitch" issues
- Explain what these indicate about capacity
- Suggest specific actions to address constraints

## Quick Wins
- Immediate actions (next 1-2 weeks) that can improve performance with minimal effort
- Be specific and actionable

## Risks & Assumptions
- Brief note on any data limitations or assumptions made
- Highlight any areas where more data would improve analysis

IMPORTANT: Do not use code fences (\`\`\`). Format as natural markdown that renders cleanly.`;

export interface AnalysisPromptData {
  overallMetrics: any;
  comparisonData: any[];
  territoryMetrics: any[];
  dateRange: { start: string; end: string };
  selectedTerritories: string[];
  selectedLeadSources: string[];
}

/**
 * Build the analysis prompt from provided data
 * Includes numeric verification instructions and output format specification
 */
export function buildAnalysisPrompt(data: AnalysisPromptData): string {
  const {
    overallMetrics,
    comparisonData,
    territoryMetrics,
    dateRange,
    selectedTerritories,
    selectedLeadSources,
  } = data;

  // Validate required data
  if (!overallMetrics) {
    throw new Error('Overall metrics are required but were not provided');
  }

  if (!dateRange || !dateRange.start || !dateRange.end) {
    throw new Error('Date range is required but was not provided');
  }

  let prompt = `# Affiliate Program Performance Analysis\n\n`;
  
  prompt += `## Date Range\n`;
  try {
    prompt += `Analyzing data from ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}\n\n`;
  } catch (e) {
    prompt += `Analyzing data from ${dateRange.start} to ${dateRange.end}\n\n`;
  }

  if (selectedTerritories.length > 0) {
    prompt += `## Selected Territories\n${selectedTerritories.join(', ')}\n\n`;
  } else {
    prompt += `## Territories\nAll territories included\n\n`;
  }

  if (selectedLeadSources.length > 0) {
    prompt += `## Selected Lead Sources\n${selectedLeadSources.join(', ')}\n\n`;
  } else {
    prompt += `## Lead Sources\nAll lead sources included\n\n`;
  }

  // Helper function to safely format numbers
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(value)) return defaultValue;
    return Number(value);
  };

  const safeFormat = (value: any, formatter: (n: number) => string, defaultValue: string = '0'): string => {
    const num = safeNumber(value);
    try {
      return formatter(num);
    } catch (e) {
      return defaultValue;
    }
  };

  prompt += `## Overall Performance Metrics\n`;
  prompt += `- Total Leads: ${safeFormat(overallMetrics.totalLeads, (n) => n.toLocaleString())}\n`;
  prompt += `- Appointments Set: ${safeFormat(overallMetrics.appointmentsSet, (n) => n.toLocaleString())}\n`;
  prompt += `- Lead to Appointment Rate: ${safeFormat(overallMetrics.leadToAppointmentRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Pitches: ${safeFormat(overallMetrics.pitches, (n) => n.toLocaleString())}\n`;
  prompt += `- Appointment to Pitch Rate: ${safeFormat(overallMetrics.appointmentToPitchRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Sales: ${safeFormat(overallMetrics.sales, (n) => n.toLocaleString())}\n`;
  prompt += `- Pitch to Sale Rate: ${safeFormat(overallMetrics.pitchToSaleRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Installed: ${safeFormat(overallMetrics.installed, (n) => n.toLocaleString())}\n`;
  prompt += `- Total Revenue: $${safeFormat(overallMetrics.totalSoldAmount, (n) => n.toLocaleString())}\n`;
  prompt += `- Installed Revenue: $${safeFormat(overallMetrics.totalInstalledRevenue, (n) => n.toLocaleString())}\n`;
  prompt += `- Revenue per Lead: $${safeFormat(overallMetrics.revenuePerLead, (n) => n.toFixed(2))}\n`;
  prompt += `- Average Sale Amount: $${safeFormat(overallMetrics.averageSaleAmount, (n) => n.toFixed(2))}\n`;
  prompt += `- Average Credit Score: ${safeNumber(overallMetrics.averageCreditScore) > 0 ? safeFormat(overallMetrics.averageCreditScore, (n) => n.toFixed(0)) : 'N/A'}\n`;
  prompt += `- Average EF Score: ${safeNumber(overallMetrics.averageEfScore) > 0 ? safeFormat(overallMetrics.averageEfScore, (n) => n.toFixed(0)) : 'N/A'}\n`;
  prompt += `- Sale Canceled Rate: ${safeFormat(overallMetrics.saleCanceledRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Appointment Canceled Rate: ${safeFormat(overallMetrics.cancellationRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- No Pitch Rate: ${safeFormat(overallMetrics.noPitchRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Credit Ran Rate: ${safeFormat(overallMetrics.creditRanRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Lender Approval Rate: ${safeFormat(overallMetrics.lenderApprovalRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Finance Decline Rate: ${safeFormat(overallMetrics.financeDeclineRate, (n) => n.toFixed(1))}%\n`;
  prompt += `- Cash Deal Rate: ${safeFormat(overallMetrics.cashDealRate, (n) => n.toFixed(1))}%\n\n`;

  if (comparisonData && comparisonData.length > 0) {
    prompt += `## Lead Source Performance Comparison\n\n`;
    comparisonData.forEach((source: any) => {
      if (!source || !source.metrics) return;
      prompt += `### ${source.leadSource || 'Unknown'}\n`;
      prompt += `- Leads: ${safeFormat(source.metrics.totalLeads, (n) => n.toLocaleString())}\n`;
      prompt += `- Conversion Rate: ${safeFormat(source.metrics.leadToAppointmentRate, (n) => n.toFixed(1))}%\n`;
      prompt += `- Revenue: $${safeFormat(source.metrics.totalSoldAmount, (n) => n.toLocaleString())}\n`;
      prompt += `- Revenue per Lead: $${safeFormat(source.metrics.revenuePerLead, (n) => n.toFixed(2))}\n`;
      prompt += `- Sales: ${safeFormat(source.metrics.sales, (n) => n.toLocaleString())}\n`;
      prompt += `- Credit Score: ${safeNumber(source.metrics.averageCreditScore) > 0 ? safeFormat(source.metrics.averageCreditScore, (n) => n.toFixed(0)) : 'N/A'}\n`;
      prompt += `- Sale Canceled Rate: ${safeFormat(source.metrics.saleCanceledRate, (n) => n.toFixed(1))}%\n`;
      prompt += `- Appt Canceled Rate: ${safeFormat(source.metrics.cancellationRate, (n) => n.toFixed(1))}%\n\n`;
    });
  }

  if (territoryMetrics && territoryMetrics.length > 0) {
    prompt += `## Territory Performance\n\n`;
    territoryMetrics.forEach((territory: any) => {
      if (!territory || !territory.metrics) return;
      prompt += `### ${territory.territory || 'Unknown'}\n`;
      prompt += `- Leads: ${safeFormat(territory.metrics.totalLeads, (n) => n.toLocaleString())}\n`;
      prompt += `- Conversion Rate: ${safeFormat(territory.metrics.leadToAppointmentRate, (n) => n.toFixed(1))}%\n`;
      prompt += `- Revenue: $${safeFormat(territory.metrics.totalSoldAmount, (n) => n.toLocaleString())}\n`;
      prompt += `- Revenue per Lead: $${safeFormat(territory.metrics.revenuePerLead, (n) => n.toFixed(2))}\n`;
      prompt += `- Sales: ${safeFormat(territory.metrics.sales, (n) => n.toLocaleString())}\n`;
      prompt += `- Appointments: ${safeFormat(territory.metrics.appointmentsSet, (n) => n.toLocaleString())}\n`;
      prompt += `- Pitches: ${safeFormat(territory.metrics.pitches, (n) => n.toLocaleString())}\n\n`;
    });
  }

  prompt += `\n## Analysis Request\n`;
  prompt += `Based on this comprehensive data, provide a concise analysis following the output format specified. `;
  prompt += `Verify all numbers and percentages before stating them. `;
  prompt += `If any metric seems inconsistent or uncertain, note that in your response. `;
  prompt += `Focus on actionable recommendations with specific, verified data points.\n\n`;
  prompt += OUTPUT_SPEC_MD;

  return prompt;
}

