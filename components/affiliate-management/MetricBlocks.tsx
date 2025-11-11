'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Target, TrendingUp, DollarSign, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AggregatedMetrics } from '@/lib/affiliate-analytics';

interface MetricBlocksProps {
  metrics: AggregatedMetrics;
  previousMetrics?: AggregatedMetrics;
}

export default function MetricBlocks({ metrics, previousMetrics }: MetricBlocksProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const ChangeIndicator = ({ current, previous }: { current: number; previous?: number }) => {
    const change = calculateChange(current, previous);
    if (change === null) return null;
    
    const isPositive = change > 0;
    return (
      <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Funnel Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-4">Funnel Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.totalLeads.toLocaleString()}</div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.totalLeads} previous={previousMetrics.totalLeads} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointments Set
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.appointmentsSet.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.leadToAppointmentRate)} conversion
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.appointmentsSet} previous={previousMetrics.appointmentsSet} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pitches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.pitches.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.appointmentToPitchRate)} conversion
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.pitches} previous={previousMetrics.pitches} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.sales.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.pitchToSaleRate)} conversion
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.sales} previous={previousMetrics.sales} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Installed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.installed.toLocaleString()}</div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.installed} previous={previousMetrics.installed} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-4">Financial Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{formatCurrency(metrics.totalSoldAmount)}</div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.totalSoldAmount} previous={previousMetrics.totalSoldAmount} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Installed Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{formatCurrency(metrics.totalInstalledRevenue)}</div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.totalInstalledRevenue} previous={previousMetrics.totalInstalledRevenue} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Sale Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{formatCurrency(metrics.averageSaleAmount)}</div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.averageSaleAmount} previous={previousMetrics.averageSaleAmount} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue per Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{formatCurrency(metrics.revenuePerLead)}</div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.revenuePerLead} previous={previousMetrics.revenuePerLead} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Credit & Finance Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-4">Credit & Finance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Ran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.creditRan.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.creditRanRate)} of pitches
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.creditRan} previous={previousMetrics.creditRan} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Lender Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.lenderApproved.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.lenderApprovalRate)} approval rate
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.lenderApproved} previous={previousMetrics.lenderApproved} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Finance Decline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.financeDecline.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.financeDeclineRate)} decline rate
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.financeDecline} previous={previousMetrics.financeDecline} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Finance Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.financeRejectedByCustomer.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.financeRejectedRate)} rejection rate
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.financeRejectedByCustomer} previous={previousMetrics.financeRejectedByCustomer} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cash Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.cashDeal.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.cashDealRate)} of sales
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.cashDeal} previous={previousMetrics.cashDeal} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quality Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-4">Quality Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Sale Canceled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.saleCanceled.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.saleCanceledRate)} of sales
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.saleCanceled} previous={previousMetrics.saleCanceled} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Avg Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">
                {metrics.averageCreditScore > 0 ? Math.round(metrics.averageCreditScore) : 'N/A'}
              </div>
              {previousMetrics && metrics.averageCreditScore > 0 && (
                <ChangeIndicator current={metrics.averageCreditScore} previous={previousMetrics.averageCreditScore} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Avg EF Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">
                {metrics.averageEfScore > 0 ? Math.round(metrics.averageEfScore) : 'N/A'}
              </div>
              {previousMetrics && metrics.averageEfScore > 0 && (
                <ChangeIndicator current={metrics.averageEfScore} previous={previousMetrics.averageEfScore} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Appt Canceled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.apptCanceled.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.cancellationRate)} cancellation rate
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.apptCanceled} previous={previousMetrics.apptCanceled} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                No Pitch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.noPitch.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercent(metrics.noPitchRate)} of appointments
              </div>
              {previousMetrics && (
                <ChangeIndicator current={metrics.noPitch} previous={previousMetrics.noPitch} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Think Unlimited Prospect Score */}
      <div>
        <h3 className="text-lg font-semibold text-navy mb-4">Think Unlimited Prospect Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Platinum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.prospectScoreDistribution.platinum.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.prospectScoreDistribution.gold.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Silver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.prospectScoreDistribution.silver.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bronze</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.prospectScoreDistribution.bronze.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unknown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{metrics.prospectScoreDistribution.unknown.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

