'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Send, Plus, Trash2, FileText, Save, Loader2, X, Pin, Download, Copy, Check } from 'lucide-react';
import { useIsAuthorizedEmail } from '@/lib/use-admin';
import { loadAffiliateFunnelData } from '@/lib/territory-map/dataLoader';
import type { AffiliateFunnelData } from '@/types/territory-map';
import { AnalysisModeSelector } from '@/components/ai/AnalysisModeSelector';
import { DocumentUpload, type UploadedFile } from '@/components/ai/DocumentUpload';
import type { AnalysisMode } from '@/types/ai-settings';
import {
  filterByTerritories,
  filterByLeadSources,
  filterByDateRange,
  getDateRangeForPreset,
  calculateMetrics,
  compareLeadSources,
  getMetricsByTerritory,
  getUniqueTerritories,
  getUniqueLeadSources,
  type DatePreset,
} from '@/lib/affiliate-analytics';

const AUTHORIZED_EMAIL = 'dan@windowsusa.com';

interface SavedReport {
  id: string;
  title: string;
  prompt: string;
  analysis: string;
  createdAt: string;
  metrics: any;
  isPinned?: boolean;
}

interface PreviousChat {
  id: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt: string;
  metrics: any;
}

interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
}

interface TokenUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
}

export default function AIAnalysisPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const isAuthorized = useIsAuthorizedEmail(AUTHORIZED_EMAIL);
  const [data, setData] = useState<AffiliateFunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('standard');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [previousChats, setPreviousChats] = useState<PreviousChat[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showSavePromptDialog, setShowSavePromptDialog] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCost: 0,
    requestCount: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [selectedLeadSources, setSelectedLeadSources] = useState<string[]>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Redirect if not authorized
  useEffect(() => {
    if (isLoaded && isSignedIn && !isAuthorized) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, isAuthorized, router]);

  useEffect(() => {
    if (isAuthorized) {
      loadData();
      loadSavedReports();
      loadPreviousChats();
      loadSavedPrompts();
      loadTokenUsage();
    }
  }, [isAuthorized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const affiliateData = await loadAffiliateFunnelData();
      setData(affiliateData);
    } catch (error) {
      console.error('Error loading affiliate funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedReports = () => {
    try {
      const saved = localStorage.getItem('ai-analysis-reports');
      if (saved) {
        const reports = JSON.parse(saved);
        // Filter only pinned reports
        setSavedReports(reports.filter((r: SavedReport) => r.isPinned));
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const loadPreviousChats = () => {
    try {
      const saved = localStorage.getItem('ai-analysis-previous-chats');
      if (saved) {
        setPreviousChats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading previous chats:', error);
    }
  };

  const loadSavedPrompts = () => {
    try {
      const saved = localStorage.getItem('ai-analysis-prompts');
      if (saved) {
        setSavedPrompts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error);
    }
  };

  const loadTokenUsage = () => {
    try {
      const saved = localStorage.getItem('ai-analysis-token-usage');
      if (saved) {
        setTokenUsage(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading token usage:', error);
    }
  };

  const updateTokenUsage = (usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) => {
    if (!usage) return;
    
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
    const inputCostPerToken = 0.15 / 1_000_000;
    const outputCostPerToken = 0.60 / 1_000_000;
    
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    
    const cost = (promptTokens * inputCostPerToken) + (completionTokens * outputCostPerToken);
    
    setTokenUsage(prev => {
      const updated = {
        totalTokens: prev.totalTokens + totalTokens,
        promptTokens: prev.promptTokens + promptTokens,
        completionTokens: prev.completionTokens + completionTokens,
        totalCost: prev.totalCost + cost,
        requestCount: prev.requestCount + 1,
      };
      localStorage.setItem('ai-analysis-token-usage', JSON.stringify(updated));
      return updated;
    });
  };

  const pinChat = () => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      // Find the last user message (the prompt) before the assistant response
      let savedPrompt = currentPrompt;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          savedPrompt = messages[i].content;
          break;
        }
      }
      
      const newReport: SavedReport = {
        id: `report-${Date.now()}`,
        title: `Chat ${new Date().toLocaleDateString()}`,
        prompt: savedPrompt,
        analysis: lastMessage.content,
        createdAt: new Date().toISOString(),
        metrics: {
          datePreset,
          selectedTerritories,
          selectedLeadSources,
        },
        isPinned: true,
      };
      
      // Load all reports, add new one, save
      const allReports = JSON.parse(localStorage.getItem('ai-analysis-reports') || '[]');
      const updated = [...allReports, newReport];
      localStorage.setItem('ai-analysis-reports', JSON.stringify(updated));
      setSavedReports(updated.filter((r: SavedReport) => r.isPinned));
    }
  };


  const downloadChatAsWord = () => {
    if (messages.length === 0) return;
    
    // Create HTML content
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>AI Analysis Chat</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .user-message { background-color: #2563eb; color: white; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .assistant-message { background-color: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
          h1 { color: #2563eb; font-size: 24px; }
          h2 { color: #2563eb; font-size: 20px; margin-top: 20px; }
          h3 { color: #2563eb; font-size: 18px; margin-top: 15px; }
          ul { margin-left: 20px; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>AI Analysis Chat</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    `;
    
    messages.forEach((message) => {
      const content = message.content.replace(/\n/g, '<br>');
      if (message.role === 'user') {
        htmlContent += `<div class="user-message"><strong>User:</strong><br>${content}</div>`;
      } else {
        htmlContent += `<div class="assistant-message"><strong>Assistant:</strong><br>${content}</div>`;
      }
    });
    
    htmlContent += `</body></html>`;
    
    // Create blob and download
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-analysis-chat-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadMessage = (content: string, index: number) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-message-${index}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const savePrompt = (name: string) => {
    if (!name.trim() || !currentPrompt.trim()) return;
    
    const newPrompt: SavedPrompt = {
      id: `prompt-${Date.now()}`,
      name,
      prompt: currentPrompt,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedPrompts, newPrompt];
    setSavedPrompts(updated);
    localStorage.setItem('ai-analysis-prompts', JSON.stringify(updated));
    setShowSavePromptDialog(false);
  };

  const loadReport = (report: SavedReport) => {
    setSelectedReport(report.id);
    setMessages([
      { role: 'user', content: report.prompt },
      { role: 'assistant', content: report.analysis },
    ]);
    setCurrentPrompt(report.prompt);
    setDatePreset(report.metrics.datePreset || 'last30');
    setSelectedTerritories(report.metrics.selectedTerritories || []);
    setSelectedLeadSources(report.metrics.selectedLeadSources || []);
  };

  const loadPreviousChat = (chat: PreviousChat) => {
    setSelectedReport(chat.id);
    setMessages(chat.messages);
    setDatePreset(chat.metrics.datePreset || 'last30');
    setSelectedTerritories(chat.metrics.selectedTerritories || []);
    setSelectedLeadSources(chat.metrics.selectedLeadSources || []);
  };

  const loadPrompt = (prompt: SavedPrompt) => {
    setCurrentPrompt(prompt.prompt);
    textareaRef.current?.focus();
  };

  const deleteReport = (id: string) => {
    const allReports = JSON.parse(localStorage.getItem('ai-analysis-reports') || '[]');
    const updated = allReports.filter((r: SavedReport) => r.id !== id);
    localStorage.setItem('ai-analysis-reports', JSON.stringify(updated));
    setSavedReports(updated.filter((r: SavedReport) => r.isPinned));
    if (selectedReport === id) {
      setSelectedReport(null);
      setMessages([]);
    }
  };

  const deletePreviousChat = (id: string) => {
    const updated = previousChats.filter(c => c.id !== id);
    setPreviousChats(updated);
    localStorage.setItem('ai-analysis-previous-chats', JSON.stringify(updated));
    if (selectedReport === id) {
      setSelectedReport(null);
      setMessages([]);
    }
  };

  const deletePrompt = (id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id);
    setSavedPrompts(updated);
    localStorage.setItem('ai-analysis-prompts', JSON.stringify(updated));
  };

  const handleAnalyze = async () => {
    if (!currentPrompt.trim() || isLoading || data.length === 0) return;

    const userMessage = { role: 'user' as const, content: currentPrompt };
    setMessages([...messages, userMessage]);
    setIsAnalyzing(true);

    console.log('[AI Analysis] Starting analysis...', { prompt: currentPrompt });

    try {
      // Apply filters
      let filteredData = [...data];
      const dateRange = getDateRangeForPreset(datePreset);
      filteredData = filterByDateRange(filteredData, dateRange);
      
      if (selectedTerritories.length > 0) {
        filteredData = filterByTerritories(filteredData, selectedTerritories);
      }
      
      if (selectedLeadSources.length > 0) {
        filteredData = filterByLeadSources(filteredData, selectedLeadSources);
      }

      console.log('[AI Analysis] Data filtered', { 
        filteredDataCount: filteredData.length,
        datePreset,
        selectedTerritories: selectedTerritories.length,
        selectedLeadSources: selectedLeadSources.length,
      });

      // Calculate metrics
      const overallMetrics = calculateMetrics(filteredData);
      const comparisonData = compareLeadSources(filteredData, selectedLeadSources.length > 0 ? selectedLeadSources : undefined);
      const territoryMetrics = getMetricsByTerritory(filteredData, selectedTerritories.length > 0 ? selectedTerritories : undefined);

      console.log('[AI Analysis] Metrics calculated', {
        totalLeads: overallMetrics.totalLeads,
        comparisonDataCount: comparisonData.length,
        territoryMetricsCount: territoryMetrics.length,
      });

      // Upload attachments first if any
      const uploadedAttachments: Array<{ id: string; type: 'document' | 'image'; url: string; name: string }> = [];
      for (const attachment of attachments) {
        try {
          const formData = new FormData();
          formData.append('file', attachment.file);
          formData.append('isGlobal', 'false');
          
          const uploadRes = await fetch('/api/ai/documents/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedAttachments.push({
              id: uploadData.document.id,
              type: uploadData.document.type,
              url: uploadData.document.url,
              name: uploadData.document.filename,
            });
          }
        } catch (uploadError) {
          console.error('Error uploading attachment:', uploadError);
        }
      }

      // Call enhanced AI API
      console.log('[AI Analysis] Making API request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      let response: Response;
      try {
        response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentPrompt,
            mode: analysisMode,
            attachments: uploadedAttachments,
            dateRange: {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            },
            selectedTerritories,
            selectedLeadSources,
            useReferenceFiles: true,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('[AI Analysis] API response received', { 
          status: response.status, 
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('[AI Analysis] Fetch error', { 
          error: fetchError.message, 
          name: fetchError.name 
        });
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The analysis is taking too long. Please try again with a simpler question or check your OpenAI API key.');
        }
        throw fetchError;
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let responseData: any;
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[AI Analysis] Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server returned an error. ${response.status} ${response.statusText}. Check server logs for details.`);
      }

      try {
        responseData = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('[AI Analysis] Failed to parse JSON response:', text.substring(0, 500));
        throw new Error(`Server returned invalid JSON. ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.details || responseData.message || 'Failed to generate analysis';
        console.error('[AI Analysis] API error response:', responseData);
        throw new Error(errorMsg);
      }

      if (!responseData.analysis) {
        throw new Error('No analysis data received from server');
      }

      console.log('[AI Analysis] Analysis received', { 
        analysisLength: responseData.analysis.length,
        model: responseData.model,
        usage: responseData.usage,
      });

      // Update token usage
      if (responseData.usage) {
        updateTokenUsage(responseData.usage);
      }

      const assistantMessage = { role: 'assistant' as const, content: responseData.analysis };
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      setCurrentPrompt('');
      // Auto-save to previous chats
      const newChat: PreviousChat = {
        id: `chat-${Date.now()}`,
        messages: updatedMessages,
        createdAt: new Date().toISOString(),
        metrics: {
          datePreset,
          selectedTerritories,
          selectedLeadSources,
        },
      };
      const allPreviousChats = JSON.parse(localStorage.getItem('ai-analysis-previous-chats') || '[]');
      const updatedChats = [newChat, ...allPreviousChats].slice(0, 50);
      setPreviousChats(updatedChats);
      localStorage.setItem('ai-analysis-previous-chats', JSON.stringify(updatedChats));
    } catch (error: any) {
      console.error('[AI Analysis] Analysis error:', error);
      const errorMessage = { role: 'assistant' as const, content: `Error: ${error.message || 'An error occurred while generating analysis. Please check your OpenAI API key configuration.'}` };
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  // Helper function to render markdown text with bold support
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    
    // Split by ** to find bold text (handles multiple bold sections)
    // Regex matches **text** but not ***text*** (which would be bold+italic)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Remove the ** markers and make it bold
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-gray-900">{boldText}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Show loading state while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Checking access...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // Redirect if not authorized (show loading while redirecting)
  if (!isAuthorized) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // Show loading while data is loading
  if (isLoading) {
    return (
      <AppLayout>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AI Analysis...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="w-full h-screen flex overflow-hidden">
        {/* Left Sidebar - Saved Reports & Prompts */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Token Usage Section */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Usage Statistics</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tokens:</span>
                <span className="font-medium text-gray-900">{tokenUsage.totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requests:</span>
                <span className="font-medium text-gray-900">{tokenUsage.requestCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium text-gray-900">${tokenUsage.totalCost.toFixed(4)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Input: {tokenUsage.promptTokens.toLocaleString()}</span>
                  <span>Output: {tokenUsage.completionTokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-blue-600 mb-4">Pinned Chats</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedReports.length === 0 ? (
                <p className="text-sm text-gray-500">No pinned chats yet</p>
              ) : (
                savedReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReport === report.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={() => loadReport(report)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{report.title}</div>
                        <div className={`text-xs mt-1 ${selectedReport === report.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReport(report.id);
                        }}
                        className="ml-2 p-1 hover:bg-red-500 rounded"
                      >
                        <Trash2 className={`h-4 w-4 ${selectedReport === report.id ? 'text-white' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-blue-600 mb-4">Previous Chats</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {previousChats.length === 0 ? (
                <p className="text-sm text-gray-500">No previous chats yet</p>
              ) : (
                previousChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReport === chat.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={() => loadPreviousChat(chat)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          Chat {new Date(chat.createdAt).toLocaleDateString()}
                        </div>
                        <div className={`text-xs mt-1 ${selectedReport === chat.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {chat.messages.length} messages
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreviousChat(chat.id);
                        }}
                        className="ml-2 p-1 hover:bg-red-500 rounded"
                      >
                        <Trash2 className={`h-4 w-4 ${selectedReport === chat.id ? 'text-white' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-600">Saved Prompts</h2>
              <Dialog open={showSavePromptDialog} onOpenChange={setShowSavePromptDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Prompt</DialogTitle>
                  </DialogHeader>
                  <SavePromptForm
                    onSave={savePrompt}
                    onCancel={() => setShowSavePromptDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {savedPrompts.length === 0 ? (
                <p className="text-sm text-gray-500">No saved prompts yet</p>
              ) : (
                savedPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 border-gray-200 cursor-pointer"
                    onClick={() => loadPrompt(prompt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{prompt.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{prompt.prompt}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePrompt(prompt.id);
                        }}
                        className="ml-2 p-1 hover:bg-red-500 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-blue-600">AI Analysis</h1>
                  <p className="text-sm text-gray-600">Get intelligent insights and recommendations</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setMessages([]);
                  setCurrentPrompt('');
                  setSelectedReport(null);
                }}
                variant="outline"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-6xl">
                  <Sparkles className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">Start a New Chat</h2>
                  <p className="text-gray-600 mb-4">
                    Ask anything or request analysis across all available data: reps, appointments, scheduling, zip code demographics and serviceability, and affiliate performance. 
                    Get insights, comparisons, summaries, anomalies, and recommendations tailored to your filters.
                  </p>
                  <p className="text-sm text-gray-500 mb-6 italic">
                    Note: Responses are optimized for conciseness and accuracy. All numbers are verified before being presented.
                  </p>
                  <div className="text-left grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Rep</div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-700 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Compare top performing reps over the last 30 days and identify what drives their success.'); textareaRef.current?.focus(); }}>
                          Compare top performing reps (last 30 days)
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-700 hover:text-blue-700 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Which reps have declining conversion rates and what actions would you recommend?'); textareaRef.current?.focus(); }}>
                          Reps with declining conversion rates
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-700 hover:text-blue-700 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Identify reps who are underbooked relative to lead volume and suggest redistribution.'); textareaRef.current?.focus(); }}>
                          Underbooked reps vs lead volume
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Appointments</div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-700 hover:text-blue-700 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Analyze appointment no-show rates by territory and time of day. Recommend scheduling adjustments.'); textareaRef.current?.focus(); }}>
                          No-show rates by territory/time
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-700 hover:text-blue-700 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Which appointment types yield the highest close rates and how should we prioritize them?'); textareaRef.current?.focus(); }}>
                          Highest close rate appointment types
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt("Forecast next month's appointment demand by territory using recent trends."); textareaRef.current?.focus(); }}>
                          Forecast next month&apos;s demand
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Scheduling</div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Find scheduling bottlenecks this week and recommend slot allocation changes by territory.'); textareaRef.current?.focus(); }}>
                          Find scheduling bottlenecks
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Optimize schedule to reduce drive-time while maintaining booking targets.'); textareaRef.current?.focus(); }}>
                          Reduce drive-time optimization
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Identify overbooked days and suggest rebalancing across territories and reps.'); textareaRef.current?.focus(); }}>
                          Rebalance overbooked days
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Zip Codes</div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Which ZIP codes have the highest conversion potential based on demographics and past performance?'); textareaRef.current?.focus(); }}>
                          High conversion ZIPs
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Recommend new serviceable ZIP codes to add given current coverage and demand.'); textareaRef.current?.focus(); }}>
                          Recommend new serviceable ZIPs
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Identify ZIP codes with high lead volume but low close rates and suggest actions.'); textareaRef.current?.focus(); }}>
                          High volume, low close ZIPs
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2">Affiliates</div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Compare affiliate performance across lead sources and recommend budget reallocation.'); textareaRef.current?.focus(); }}>
                          Affiliate performance comparison
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Which affiliates are underperforming after controlling for territory and seasonality?'); textareaRef.current?.focus(); }}>
                          Underperforming affiliates (controlled)
                        </Button>
                        <Button variant="outline" size="sm" className="w-full max-w-full justify-start text-left whitespace-normal break-words h-auto items-start flex-wrap border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4"
                          onClick={() => { setCurrentPrompt('Recommend optimizations for the next quarter across affiliates and lead sources.'); textareaRef.current?.focus(); }}>
                          Next quarter affiliate optimizations
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <div className="flex gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => downloadMessage(message.content, index)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        {message.content.split('\n').map((line, i) => {
                          if (line.startsWith('### ')) {
                            const content = line.replace('### ', '');
                            return (
                              <h3 key={i} className="text-lg font-semibold text-blue-600 mt-4 mb-2">
                                {renderMarkdownText(content)}
                              </h3>
                            );
                          }
                          if (line.startsWith('## ')) {
                            const content = line.replace('## ', '');
                            return (
                              <h2 key={i} className="text-xl font-bold text-blue-600 mt-6 mb-3">
                                {renderMarkdownText(content)}
                              </h2>
                            );
                          }
                          if (line.startsWith('# ')) {
                            const content = line.replace('# ', '');
                            return (
                              <h1 key={i} className="text-2xl font-bold text-blue-600 mt-6 mb-4">
                                {renderMarkdownText(content)}
                              </h1>
                            );
                          }
                          if (line.match(/^\s*-\s/)) {
                            // Extract indentation and content
                            const indentMatch = line.match(/^(\s*)-/);
                            const indentLevel = indentMatch ? indentMatch[1].length : 0;
                            const content = line.replace(/^\s*-\s*/, '');
                            const marginLeft = indentLevel > 2 ? 'ml-8' : indentLevel > 0 ? 'ml-6' : 'ml-4';
                            return (
                              <div key={i} className={`${marginLeft} mb-1 flex items-start`}>
                                <span className="mr-2">•</span>
                                <span className="flex-1">{renderMarkdownText(content)}</span>
                              </div>
                            );
                          }
                          if (line.trim() === '') {
                            return <br key={i} />;
                          }
                          return (
                            <p key={i} className="mb-2">
                              {renderMarkdownText(line)}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/20"
                            onClick={() => copyToClipboard(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/20"
                            onClick={() => downloadMessage(message.content, index)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
              <div className="flex gap-3 justify-center mt-6">
                <Button
                  onClick={pinChat}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Pin className="h-4 w-4 mr-2" />
                  Pin Chat
                </Button>
                <Button
                  onClick={downloadChatAsWord}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Chat as Word
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Analysis Mode Selector */}
              <AnalysisModeSelector
                value={analysisMode}
                onChange={setAnalysisMode}
              />

              {/* Document Upload */}
              <DocumentUpload
                onFilesChange={(files) => setAttachments(files)}
                maxFiles={5}
                maxSizeMB={10}
              />

              {/* Prompt Input */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask a question or request an analysis..."
                    rows={3}
                    className="resize-none"
                    disabled={isAnalyzing}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!currentPrompt.trim() || isAnalyzing || data.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

function SavePromptForm({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Prompt Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter prompt name"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(name)} disabled={!name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
          Save
        </Button>
      </div>
    </div>
  );
}

