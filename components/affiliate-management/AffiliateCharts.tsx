'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { TimeSeriesDataPoint, ComparisonData } from '@/lib/affiliate-analytics';

interface AffiliateChartsProps {
  timeSeriesData: TimeSeriesDataPoint[];
  comparisonData: ComparisonData[];
  selectedLeadSources: string[];
  comparisonMode: 'individual' | 'comparison';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function AffiliateCharts({
  timeSeriesData,
  comparisonData,
  selectedLeadSources,
  comparisonMode,
}: AffiliateChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Prepare data for funnel chart
  const funnelData = comparisonData.length > 0
    ? [
        {
          name: 'Leads',
          value: comparisonData.reduce((sum, d) => sum + d.metrics.totalLeads, 0),
        },
        {
          name: 'Appointments',
          value: comparisonData.reduce((sum, d) => sum + d.metrics.appointmentsSet, 0),
        },
        {
          name: 'Pitches',
          value: comparisonData.reduce((sum, d) => sum + d.metrics.pitches, 0),
        },
        {
          name: 'Sales',
          value: comparisonData.reduce((sum, d) => sum + d.metrics.sales, 0),
        },
        {
          name: 'Installed',
          value: comparisonData.reduce((sum, d) => sum + d.metrics.installed, 0),
        },
      ]
    : [];

  // Prepare data for pie chart (revenue by lead source)
  const revenueBySource = comparisonData
    .map((d, index) => ({
      name: d.leadSource,
      value: d.metrics.totalSoldAmount,
      color: COLORS[index % COLORS.length],
    }))
    .filter(d => d.value > 0);

  // Prepare time series data for line chart
  // In individual mode with one source, show that source's data
  // In comparison mode, show aggregated data or multiple sources
  const lineChartData = useMemo(() => {
    if (comparisonMode === 'individual' && comparisonData.length === 1) {
      // Individual mode with one source - we need to show that source's time series
      // For now, show aggregated metrics over time
      return timeSeriesData.map(point => ({
        date: point.date,
        Leads: point.metrics.totalLeads,
        Appointments: point.metrics.appointmentsSet,
        Pitches: point.metrics.pitches,
        Sales: point.metrics.sales,
        Revenue: point.metrics.totalSoldAmount,
      }));
    } else {
      // Comparison mode or multiple sources - show aggregated data
      return timeSeriesData.map(point => ({
        date: point.date,
        Leads: point.metrics.totalLeads,
        Appointments: point.metrics.appointmentsSet,
        Pitches: point.metrics.pitches,
        Sales: point.metrics.sales,
        Revenue: point.metrics.totalSoldAmount,
      }));
    }
  }, [timeSeriesData, comparisonMode, comparisonData]);

  // Prepare comparison data for bar chart
  const barChartData = useMemo(() => {
    if (comparisonMode === 'individual' && comparisonData.length === 1) {
      // Individual mode - show single source data
      const source = comparisonData[0];
      const totalLeads = source.metrics.totalLeads;
      return [{
        name: source.leadSource,
        fullName: source.leadSource,
        Leads: source.metrics.totalLeads,
        Appointments: source.metrics.appointmentsSet,
        Pitches: source.metrics.pitches,
        Sales: source.metrics.sales,
        Revenue: source.metrics.totalSoldAmount,
        'Conversion %': source.metrics.leadToAppointmentRate,
        leadsPercent: '100.0', // Always 100% for leads
        apptsPercent: totalLeads > 0 ? ((source.metrics.appointmentsSet / totalLeads) * 100).toFixed(1) : '0',
        pitchesPercent: totalLeads > 0 ? ((source.metrics.pitches / totalLeads) * 100).toFixed(1) : '0',
        salesPercent: totalLeads > 0 ? ((source.metrics.sales / totalLeads) * 100).toFixed(1) : '0',
      }];
    } else {
      // Comparison mode - show all sources, sorted by value for specific charts
      return comparisonData.map((d, index) => {
        const totalLeads = d.metrics.totalLeads;
        return {
          name: d.leadSource,
          fullName: d.leadSource,
          Leads: d.metrics.totalLeads,
          Appointments: d.metrics.appointmentsSet,
          Pitches: d.metrics.pitches,
          Sales: d.metrics.sales,
          Revenue: d.metrics.totalSoldAmount,
          'Conversion %': d.metrics.leadToAppointmentRate,
          leadsPercent: '100.0', // Always 100% for leads
          apptsPercent: totalLeads > 0 ? ((d.metrics.appointmentsSet / totalLeads) * 100).toFixed(1) : '0',
          pitchesPercent: totalLeads > 0 ? ((d.metrics.pitches / totalLeads) * 100).toFixed(1) : '0',
          salesPercent: totalLeads > 0 ? ((d.metrics.sales / totalLeads) * 100).toFixed(1) : '0',
        };
      });
    }
  }, [comparisonData, comparisonMode]);

  // Sorted data for conversion rates chart (highest to lowest)
  const conversionRatesData = useMemo(() => {
    return [...barChartData].sort((a, b) => b['Conversion %'] - a['Conversion %']);
  }, [barChartData]);

  // Sorted data for revenue chart (highest to lowest)
  const revenueData = useMemo(() => {
    return [...barChartData].sort((a, b) => b.Revenue - a.Revenue);
  }, [barChartData]);

  return (
    <div className="space-y-6">
      {/* Line Chart - Trends Over Time */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => formatDate(value)} />
                <Legend />
                {/* Order: Leads, Appointments, Pitches, Sales */}
                <Line type="monotone" dataKey="Leads" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="Appointments" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="Pitches" stroke="#FFBB28" strokeWidth={2} />
                <Line type="monotone" dataKey="Sales" stroke="#FF8042" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue Trend Line Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(value) => formatDate(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart - Comparison */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {comparisonMode === 'individual' && comparisonData.length === 1
                ? `${comparisonData[0].leadSource} - Performance Overview`
                : 'Lead Source Comparison'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={barChartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  tick={{ fontSize: 8 }}
                  interval={0}
                  width={60}
                />
                <YAxis tick={{ fontSize: 9 }} width={50} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                {/* Order: Leads, Appointments, Pitches, Sales */}
                <Bar dataKey="Leads" fill="#0088FE" barSize={20}>
                  <LabelList 
                    dataKey="leadsPercent" 
                    position="top" 
                    formatter={(value: any) => `${value}%`}
                    style={{ fontSize: '9px' }}
                  />
                </Bar>
                <Bar dataKey="Appointments" fill="#00C49F" barSize={20}>
                  <LabelList 
                    dataKey="apptsPercent" 
                    position="top" 
                    formatter={(value: any) => `${value}%`}
                    style={{ fontSize: '9px' }}
                  />
                </Bar>
                <Bar dataKey="Pitches" fill="#FFBB28" barSize={20}>
                  <LabelList 
                    dataKey="pitchesPercent" 
                    position="top" 
                    formatter={(value: any) => `${value}%`}
                    style={{ fontSize: '9px' }}
                  />
                </Bar>
                <Bar dataKey="Sales" fill="#FF8042" barSize={20}>
                  <LabelList 
                    dataKey="salesPercent" 
                    position="top" 
                    formatter={(value: any) => `${value}%`}
                    style={{ fontSize: '9px' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue Comparison Bar Chart */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Lead Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={100}
                  width={100}
                  tickFormatter={(value) => {
                    // Wrap text to fit under bar - split long names
                    if (value.length > 15) {
                      const mid = Math.floor(value.length / 2);
                      const spaceIndex = value.lastIndexOf(' ', mid);
                      if (spaceIndex > 0) {
                        return value.substring(0, spaceIndex) + '\n' + value.substring(spaceIndex + 1);
                      }
                      return value.substring(0, mid) + '\n' + value.substring(mid);
                    }
                    return value;
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="Revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Funnel Chart (Bar Chart styled as funnel) */}
      {funnelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    const total = funnelData[0]?.value || 1;
                    const percent = ((value / total) * 100).toFixed(1);
                    return [`${value.toLocaleString()} (${percent}%)`, name];
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => {
                    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pie Chart - Revenue Distribution */}
      {revenueBySource.length > 0 && comparisonMode === 'comparison' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution by Lead Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const shortName = name && name.length > 15 ? name.substring(0, 15) + '...' : (name || '');
                    return `${shortName}: ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Conversion Rates Comparison */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {comparisonMode === 'individual' && comparisonData.length === 1
                ? `${comparisonData[0].leadSource} - Conversion Rates`
                : 'Conversion Rates by Lead Source'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionRatesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={0}
                  textAnchor="middle"
                  height={100}
                  width={100}
                  tickFormatter={(value) => {
                    // Wrap text to fit under bar - split long names
                    if (value.length > 15) {
                      const mid = Math.floor(value.length / 2);
                      const spaceIndex = value.lastIndexOf(' ', mid);
                      if (spaceIndex > 0) {
                        return value.substring(0, spaceIndex) + '\n' + value.substring(spaceIndex + 1);
                      }
                      return value.substring(0, mid) + '\n' + value.substring(mid);
                    }
                    return value;
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="Conversion %" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

