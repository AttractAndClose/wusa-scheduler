'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Table, BarChart3 } from 'lucide-react';
import type { ComparisonData } from '@/lib/affiliate-analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonTableProps {
  comparisonData: ComparisonData[];
  comparisonMode: 'individual' | 'comparison';
}

type SortField = 'leadSource' | 'totalLeads' | 'appointmentsSet' | 'conversionRate' | 'sales' | 'revenue' | 'creditScore' | 'creditRan' | 'lenderApproved' | 'financeDecline' | 'cashDeal' | 'financeRejected' | 'saleCanceled' | 'apptCanceled' | 'noPitch' | 'installed';
type SortDirection = 'asc' | 'desc';

export default function ComparisonTable({ comparisonData, comparisonMode }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalLeads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const sortedData = useMemo(() => {
    const sorted = [...comparisonData].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'leadSource':
          aValue = a.leadSource;
          bValue = b.leadSource;
          break;
        case 'totalLeads':
          aValue = a.metrics.totalLeads;
          bValue = b.metrics.totalLeads;
          break;
        case 'appointmentsSet':
          aValue = a.metrics.appointmentsSet;
          bValue = b.metrics.appointmentsSet;
          break;
        case 'conversionRate':
          aValue = a.metrics.leadToAppointmentRate;
          bValue = b.metrics.leadToAppointmentRate;
          break;
        case 'sales':
          aValue = a.metrics.sales;
          bValue = b.metrics.sales;
          break;
        case 'revenue':
          aValue = a.metrics.totalSoldAmount;
          bValue = b.metrics.totalSoldAmount;
          break;
        case 'creditScore':
          aValue = a.metrics.averageCreditScore;
          bValue = b.metrics.averageCreditScore;
          break;
        case 'creditRan':
          aValue = a.metrics.creditRan;
          bValue = b.metrics.creditRan;
          break;
        case 'lenderApproved':
          aValue = a.metrics.lenderApproved;
          bValue = b.metrics.lenderApproved;
          break;
        case 'financeDecline':
          aValue = a.metrics.financeDecline;
          bValue = b.metrics.financeDecline;
          break;
        case 'cashDeal':
          aValue = a.metrics.cashDeal;
          bValue = b.metrics.cashDeal;
          break;
        case 'financeRejected':
          aValue = a.metrics.financeRejectedByCustomer;
          bValue = b.metrics.financeRejectedByCustomer;
          break;
        case 'saleCanceled':
          aValue = a.metrics.saleCanceled;
          bValue = b.metrics.saleCanceled;
          break;
        case 'apptCanceled':
          aValue = a.metrics.apptCanceled;
          bValue = b.metrics.apptCanceled;
          break;
        case 'noPitch':
          aValue = a.metrics.noPitch;
          bValue = b.metrics.noPitch;
          break;
        case 'installed':
          aValue = a.metrics.installed;
          bValue = b.metrics.installed;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numA = Number(aValue);
      const numB = Number(bValue);

      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [comparisonData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

  const SortButton = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-0.5 hover:text-primary transition-colors"
      >
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    );
  };

  // Find best and worst performers
  const bestRevenue = sortedData.length > 0 ? Math.max(...sortedData.map(d => d.metrics.totalSoldAmount)) : 0;
  const bestConversion = sortedData.length > 0 ? Math.max(...sortedData.map(d => d.metrics.leadToAppointmentRate)) : 0;

  // Prepare data for charts
  const chartData = sortedData.map(item => ({
    name: item.leadSource.length > 15 ? item.leadSource.substring(0, 15) + '...' : item.leadSource,
    fullName: item.leadSource,
    Leads: item.metrics.totalLeads,
    Appointments: item.metrics.appointmentsSet,
    Pitches: item.metrics.pitches,
    Sales: item.metrics.sales,
    Revenue: item.metrics.totalSoldAmount,
    'Conversion %': item.metrics.leadToAppointmentRate,
  }));

  if (comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {comparisonMode === 'individual' ? 'Individual Lead Source' : 'Lead Source Comparison'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            {comparisonMode === 'individual'
              ? 'Please select a lead source to view individual metrics'
              : 'No data available for comparison'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {comparisonMode === 'individual' && comparisonData.length === 1
              ? `${comparisonData[0].leadSource} - Detailed Metrics`
              : 'Lead Source Comparison'}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Chart
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          <div className="w-full overflow-x-visible">
            <table className="w-full border-collapse" style={{ tableLayout: 'auto', fontSize: '0.875rem' }}>
            <thead>
              <tr className="border-b">
                <th className="text-left p-1 font-semibold text-navy text-xs" style={{ width: '140px', minWidth: '140px' }}>
                  <div className="flex items-center gap-0.5">
                    Lead Source
                    <SortButton field="leadSource" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Leads
                    <SortButton field="totalLeads" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Appts
                    <SortButton field="appointmentsSet" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Conv %
                    <SortButton field="conversionRate" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Pitches
                    <SortButton field="sales" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Sales
                    <SortButton field="sales" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '80px', minWidth: '80px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Revenue
                    <SortButton field="revenue" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '65px', minWidth: '65px' }}>Rev/Lead</th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '55px', minWidth: '55px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Credit
                    <SortButton field="creditScore" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Cr Ran
                    <SortButton field="creditRan" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '65px', minWidth: '65px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Lndr App
                    <SortButton field="lenderApproved" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Fin Dec
                    <SortButton field="financeDecline" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '55px', minWidth: '55px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Cash
                    <SortButton field="cashDeal" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Fin Rej
                    <SortButton field="financeRejected" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Sale Can
                    <SortButton field="saleCanceled" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Appt Can
                    <SortButton field="apptCanceled" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '60px', minWidth: '60px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    No Pitch
                    <SortButton field="noPitch" />
                  </div>
                </th>
                <th className="text-right p-1 font-semibold text-navy text-xs" style={{ width: '50px', minWidth: '50px' }}>
                  <div className="flex items-center justify-end gap-0.5">
                    Instl
                    <SortButton field="installed" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => {
                const isBestRevenue = item.metrics.totalSoldAmount === bestRevenue && bestRevenue > 0;
                const isBestConversion = item.metrics.leadToAppointmentRate === bestConversion && bestConversion > 0;
                
                return (
                  <tr
                    key={item.leadSource}
                    className={`border-b hover:bg-gray-50 ${
                      isBestRevenue || isBestConversion ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="p-1 font-medium text-xs" style={{ width: '140px', minWidth: '140px', maxWidth: '140px', lineHeight: '1.2' }}>{item.leadSource}</td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>{item.metrics.totalLeads.toLocaleString()}</td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>{item.metrics.appointmentsSet.toLocaleString()}</td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      <span className={isBestConversion ? 'font-bold text-green-600' : ''}>
                        {formatPercent(item.metrics.leadToAppointmentRate)}
                      </span>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>{item.metrics.pitches.toLocaleString()}</td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>{item.metrics.sales.toLocaleString()}</td>
                    <td className="p-1 text-right text-xs" style={{ width: '80px', minWidth: '80px' }}>
                      <span className={isBestRevenue ? 'font-bold text-green-600' : ''}>
                        {formatCurrency(item.metrics.totalSoldAmount)}
                      </span>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '65px', minWidth: '65px' }}>
                      {formatCurrency(item.metrics.revenuePerLead)}
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '55px', minWidth: '55px' }}>
                      {item.metrics.averageCreditScore > 0
                        ? Math.round(item.metrics.averageCreditScore)
                        : 'N/A'}
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      {item.metrics.creditRan.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.creditRanRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '65px', minWidth: '65px' }}>
                      {item.metrics.lenderApproved.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.lenderApprovalRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      {item.metrics.financeDecline.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.financeDeclineRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '55px', minWidth: '55px' }}>
                      {item.metrics.cashDeal.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.cashDealRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      {item.metrics.financeRejectedByCustomer.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.financeRejectedRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      {item.metrics.saleCanceled.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.saleCanceledRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      {item.metrics.apptCanceled.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.cancellationRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '60px', minWidth: '60px' }}>
                      {item.metrics.noPitch.toLocaleString()}
                      <div className="text-[10px] text-gray-500 leading-tight">
                        {formatPercent(item.metrics.noPitchRate)}
                      </div>
                    </td>
                    <td className="p-1 text-right text-xs" style={{ width: '50px', minWidth: '50px' }}>
                      {item.metrics.installed.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="space-y-6">
            {/* Leads and Appointments by Lead Source */}
            <div>
              <h4 className="text-sm font-semibold text-navy mb-4">Leads & Appointments by Lead Source</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Leads" fill="#0088FE" />
                  <Bar dataKey="Appointments" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Lead Source */}
            <div>
              <h4 className="text-sm font-semibold text-navy mb-4">Revenue by Lead Source</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Rates by Lead Source */}
            <div>
              <h4 className="text-sm font-semibold text-navy mb-4">Conversion Rates by Lead Source</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Conversion %" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

