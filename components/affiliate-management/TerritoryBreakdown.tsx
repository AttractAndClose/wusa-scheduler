'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, BarChart3, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { TerritoryMetrics } from '@/lib/affiliate-analytics';
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

interface TerritoryBreakdownProps {
  territoryMetrics: TerritoryMetrics[];
}

type SortField = 'territory' | 'totalLeads' | 'appointmentsSet' | 'leadToAppointmentRate' | 'pitches' | 'sales' | 'totalSoldAmount' | 'averageCreditScore' | 'revenuePerLead';
type SortDirection = 'asc' | 'desc';

export default function TerritoryBreakdown({ territoryMetrics }: TerritoryBreakdownProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [sortField, setSortField] = useState<SortField>('totalLeads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const SortButton = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    const direction = isActive ? sortDirection : undefined;
    
    return (
      <button
        onClick={() => {
          if (sortField === field) {
            setSortDirection(direction === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('desc');
          }
        }}
        className="ml-1 hover:bg-gray-200 rounded p-0.5"
      >
        {direction === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : direction === 'desc' ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-400" />
        )}
      </button>
    );
  };

  const sortedTerritoryMetrics = useMemo(() => {
    const sorted = [...territoryMetrics].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'territory':
          aValue = a.territory;
          bValue = b.territory;
          break;
        case 'totalLeads':
          aValue = a.metrics.totalLeads;
          bValue = b.metrics.totalLeads;
          break;
        case 'appointmentsSet':
          aValue = a.metrics.appointmentsSet;
          bValue = b.metrics.appointmentsSet;
          break;
        case 'leadToAppointmentRate':
          aValue = a.metrics.leadToAppointmentRate;
          bValue = b.metrics.leadToAppointmentRate;
          break;
        case 'pitches':
          aValue = a.metrics.pitches;
          bValue = b.metrics.pitches;
          break;
        case 'sales':
          aValue = a.metrics.sales;
          bValue = b.metrics.sales;
          break;
        case 'totalSoldAmount':
          aValue = a.metrics.totalSoldAmount;
          bValue = b.metrics.totalSoldAmount;
          break;
        case 'averageCreditScore':
          aValue = a.metrics.averageCreditScore;
          bValue = b.metrics.averageCreditScore;
          break;
        case 'revenuePerLead':
          aValue = a.metrics.revenuePerLead;
          bValue = b.metrics.revenuePerLead;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [territoryMetrics, sortField, sortDirection]);

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

  // Prepare data for charts
  const chartData = sortedTerritoryMetrics.map(territory => ({
    name: territory.territory.length > 15 ? territory.territory.substring(0, 15) + '...' : territory.territory,
    fullName: territory.territory,
    Leads: territory.metrics.totalLeads,
    Appointments: territory.metrics.appointmentsSet,
    Sales: territory.metrics.sales,
    Revenue: territory.metrics.totalSoldAmount,
    'Conversion %': territory.metrics.leadToAppointmentRate,
  }));

  if (territoryMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Territory Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No territory data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Territory Breakdown</CardTitle>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-navy">
                    <div className="flex items-center gap-1">
                      Territory
                      <SortButton field="territory" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Leads
                      <SortButton field="totalLeads" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Appointments
                      <SortButton field="appointmentsSet" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Conversion %
                      <SortButton field="leadToAppointmentRate" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Pitches
                      <SortButton field="pitches" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Sales
                      <SortButton field="sales" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Revenue
                      <SortButton field="totalSoldAmount" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Avg Credit Score
                      <SortButton field="averageCreditScore" />
                    </div>
                  </th>
                  <th className="text-right p-3 font-semibold text-navy">
                    <div className="flex items-center justify-end gap-1">
                      Revenue/Lead
                      <SortButton field="revenuePerLead" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTerritoryMetrics.map((territory) => (
                  <tr key={territory.territory} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{territory.territory}</td>
                    <td className="p-3 text-right">{territory.metrics.totalLeads.toLocaleString()}</td>
                    <td className="p-3 text-right">{territory.metrics.appointmentsSet.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {formatPercent(territory.metrics.leadToAppointmentRate)}
                    </td>
                    <td className="p-3 text-right">{territory.metrics.pitches.toLocaleString()}</td>
                    <td className="p-3 text-right">{territory.metrics.sales.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(territory.metrics.totalSoldAmount)}
                    </td>
                    <td className="p-3 text-right">
                      {territory.metrics.averageCreditScore > 0
                        ? Math.round(territory.metrics.averageCreditScore)
                        : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(territory.metrics.revenuePerLead)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Leads and Appointments by Territory */}
            <div>
              <h4 className="text-sm font-semibold text-navy mb-4">Leads & Appointments by Territory</h4>
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

            {/* Revenue by Territory */}
            <div>
              <h4 className="text-sm font-semibold text-navy mb-4">Revenue by Territory</h4>
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

            {/* Conversion Rates by Territory */}
            <div>
              <h4 className="text-sm font-semibold text-navy mb-4">Conversion Rates by Territory</h4>
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

