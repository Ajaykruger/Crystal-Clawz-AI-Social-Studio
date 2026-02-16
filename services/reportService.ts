
import { ReportDefinition, ReportRun, ReportTemplate, Platform } from '../types';

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'post_performance',
    name: 'Post Performance',
    description: 'Detailed analysis of top performing content based on specific metrics.',
    defaultWidgets: ['kpi_primary_metric', 'table_top_posts', 'insights_summary']
  },
  {
    id: 'performance_overview',
    name: 'Performance Overview',
    description: 'High-level metrics on reach, engagement, and growth across selected platforms.',
    defaultWidgets: ['kpi_reach', 'kpi_engagement', 'chart_growth']
  },
  {
    id: 'workflow_overview',
    name: 'Workflow Overview',
    description: 'Track team efficiency: drafts created, review times, and publication consistency.',
    defaultWidgets: ['kpi_drafts', 'kpi_approval_time', 'table_bottlenecks']
  },
  {
    id: 'calendar_gaps',
    name: 'Calendar Gaps & Consistency',
    description: 'Identify empty days and content mix imbalances in your schedule.',
    defaultWidgets: ['alert_gaps', 'heatmap_posting']
  },
  {
    id: 'review_throughput',
    name: 'Review Queue Throughput',
    description: 'Analyze how fast content moves from Draft to Approved.',
    defaultWidgets: ['kpi_avg_review_time', 'list_stuck_items']
  },
  {
    id: 'draft_health',
    name: 'Draft Health',
    description: 'Quality check summary for all current drafts.',
    defaultWidgets: ['kpi_health_score', 'chart_readiness']
  },
  {
    id: 'library_coverage',
    name: 'Library Coverage',
    description: 'Analysis of available assets versus planned content needs.',
    defaultWidgets: ['kpi_asset_count', 'alert_missing_formats']
  }
];

// In-memory mock storage
let savedReports: ReportDefinition[] = [
    {
        id: 'rep_001',
        name: 'Weekly Performance',
        templateId: 'performance_overview',
        scope: { platforms: [Platform.Instagram, Platform.Facebook], dateRange: 'last_7_days' },
        createdAt: '2025-01-20T10:00:00',
        lastRunAt: '2025-01-26T09:00:00'
    }
];

let reportRuns: Record<string, ReportRun[]> = {};

export const getReportTemplates = () => REPORT_TEMPLATES;

export const getSavedReports = () => savedReports;

export const saveReport = (def: Omit<ReportDefinition, 'id' | 'createdAt'>): ReportDefinition => {
    const newReport: ReportDefinition = {
        ...def,
        id: `rep_${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    savedReports = [newReport, ...savedReports];
    return newReport;
};

export const deleteReport = (id: string) => {
    savedReports = savedReports.filter(r => r.id !== id);
};

export const runReport = async (reportId: string): Promise<ReportRun> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const report = savedReports.find(r => r.id === reportId);
    if (!report) throw new Error("Report not found");

    // Mock Data Generator based on template
    const results = generateMockResults(report.templateId);

    const run: ReportRun = {
        id: `run_${Date.now()}`,
        reportId,
        status: 'SUCCESS',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        results
    };

    if (!reportRuns[reportId]) reportRuns[reportId] = [];
    reportRuns[reportId] = [run, ...reportRuns[reportId]];
    
    // Update last run
    const rIdx = savedReports.findIndex(r => r.id === reportId);
    if(rIdx >= 0) savedReports[rIdx].lastRunAt = run.finishedAt;

    return run;
};

export const getLatestRun = (reportId: string): ReportRun | null => {
    return reportRuns[reportId]?.[0] || null;
};

// Helper for AI mapping
export const mapIntentToTemplate = (intent: string): string => {
    const map: Record<string, string> = {
        'find_top_posts': 'post_performance',
        'performance_overview': 'performance_overview',
        'calendar_gaps': 'calendar_gaps',
        'review_throughput': 'review_throughput',
        'draft_health': 'draft_health'
    };
    return map[intent] || 'performance_overview';
};

const generateMockResults = (templateId: string): ReportRun['results'] => {
    // Generic mock data factory
    switch (templateId) {
        case 'post_performance':
            return {
                kpis: [
                    { label: 'Highest Reach', value: '18.2k', change: '+5%', trend: 'up' },
                    { label: 'Top Engagement', value: '12%', change: '+2%', trend: 'up' },
                ],
                insights: [
                    'Your tutorial Reel from Tuesday has the highest engagement (12%).',
                    'Posts with "Cat Eye" in the caption are converting 2x better.',
                ],
                recommendations: [
                    { label: 'Boost the top performing Reel to extend reach.', action: { view: 'dashboard' } },
                    { label: 'Create another Cat Eye tutorial.', action: { view: 'create' } }
                ],
                tables: [
                    {
                        title: 'Top Posts (Last 7 Days)',
                        columns: ['Post', 'Platform', 'Metric', 'Value'],
                        rows: [
                            ['Cat Eye Tutorial', 'Instagram', 'Views', '18.2k'],
                            ['Flash Sale', 'Facebook', 'Clicks', '240'],
                            ['Unboxing', 'TikTok', 'Views', '12.5k']
                        ]
                    }
                ]
            };
        case 'performance_overview':
            return {
                kpis: [
                    { label: 'Total Reach', value: '45.2k', change: '+12%', trend: 'up' as const },
                    { label: 'Engagement Rate', value: '4.8%', change: '+0.5%', trend: 'up' as const },
                    { label: 'Link Clicks', value: '1,240', change: '-2%', trend: 'down' as const },
                ],
                insights: [
                    'Reels are outperforming static posts by 240% this week.',
                    'Wednesday at 7 PM is your highest engagement window.',
                    'Hashtag #GelPolish is driving 15% of organic reach.'
                ],
                recommendations: [
                    {
                        label: 'Post 2 more Reels next week to capitalize on reach.',
                        action: { view: 'calendar', params: { tab: 'plan' } }
                    },
                    {
                        label: 'Reschedule evening posts to 7 PM.',
                        action: { view: 'calendar', params: { tab: 'schedule' } }
                    },
                    {
                        label: 'Engage with comments within the first hour.',
                        action: { view: 'dashboard' }
                    }
                ],
                tables: [
                    {
                        title: 'Top Performing Posts',
                        columns: ['Post', 'Platform', 'Reach', 'Eng.'],
                        rows: [
                            ['Summer Trends', 'Instagram', '12k', '8.5%'],
                            ['Rubber Base Demo', 'TikTok', '8.5k', '12%'],
                            ['Client Spotlight', 'Facebook', '3k', '2.1%']
                        ]
                    }
                ]
            };
        case 'calendar_gaps':
            return {
                kpis: [
                    { label: 'Gap Days', value: '2', change: '-1', trend: 'up' as const },
                    { label: 'Planned Posts', value: '12', change: '0', trend: 'neutral' as const },
                    { label: 'Format Mix', value: 'Good', change: '', trend: 'neutral' as const },
                ],
                insights: [
                    'No posts scheduled for this coming weekend.',
                    'You have 3 Educational posts in a row on Mon/Tue.'
                ],
                recommendations: [
                    {
                        label: 'Fill Saturday gap with a "Community" post.',
                        action: { view: 'create' }
                    },
                    {
                        label: 'Spread out educational content to alternate days.',
                        action: { view: 'calendar' }
                    }
                ],
                tables: []
            };
        default:
            return {
                kpis: [
                    { label: 'Items Processed', value: '24', change: '+5', trend: 'up' as const },
                    { label: 'Avg Time', value: '1.2 days', change: '-0.5', trend: 'up' as const },
                ],
                insights: [
                    'Workflow is efficient.',
                    'Review queue is clear.'
                ],
                recommendations: [
                    {
                        label: 'Maintain current cadence.',
                    }
                ]
            };
    }
}
