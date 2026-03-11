import type { ViewSet } from './ViewSetTypes'

/**
 * Default ViewSets for Opportunities data source.
 *
 * These ViewSets are provided out-of-the-box for the opportunities.mainList
 * data source and serve as templates for users to customize.
 */

export const OPPORTUNITIES_PIPELINE_VIEWSET: ViewSet = {
  id: 'default-opportunities-pipeline',
  name: 'Opportunities Pipeline',
  isDefault: true,
  isModified: false,
  description: 'Kanban-style board view grouped by opportunity status',
  data: {
    layout: 'board',
    grouping: {
      field: 'status',
      label: 'Status',
      showEmpty: true,
      order: ['new', 'reviewing', 'applied', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn'],
      colors: {
        new: '#3b82f6',
        reviewing: '#8b5cf6',
        applied: '#f59e0b',
        interviewing: '#10b981',
        offer: '#06b6d4',
        accepted: '#22c55e',
        rejected: '#ef4444',
        withdrawn: '#6b7280'
      }
    },
    columns: [
      { field: 'title', label: 'Opportunity Title', visible: true, order: 0, width: '250px' },
      { field: 'company', label: 'Company', visible: true, order: 1, width: '180px' },
      { field: 'matchScore', label: 'Match Score', visible: true, order: 2, width: '120px' },
      { field: 'savedAt', label: 'Saved At', visible: true, order: 3, width: '140px' }
    ],
    sorts: [{ field: 'savedAt', direction: 'desc' }],
    filters: [],
    pageSize: 25,
    infiniteScroll: false
  },
  createdAt: new Date('2025-02-11T00:00:00Z').toISOString(),
  updatedAt: new Date('2025-02-11T00:00:00Z').toISOString(),
  tags: ['default', 'board', 'pipeline']
}

export const OPPORTUNITIES_TABLE_VIEWSET: ViewSet = {
  id: 'default-opportunities-table',
  name: 'All Opportunities',
  isDefault: false,
  isModified: false,
  description: 'Comprehensive table view of all opportunities',
  data: {
    layout: 'table',
    columns: [
      { field: 'title', label: 'Opportunity Title', visible: true, order: 0, width: '300px', pinned: 'left' },
      { field: 'company', label: 'Company', visible: true, order: 1, width: '200px' },
      { field: 'location', label: 'Location', visible: true, order: 2, width: '180px' },
      { field: 'salary', label: 'Salary Range', visible: true, order: 3, width: '150px' },
      { field: 'work_mode', label: 'Work Mode', visible: true, order: 4, width: '120px' },
      { field: 'zone', label: 'Zone', visible: true, order: 5, width: '100px' },
      { field: 'match_score', label: 'Match Score', visible: true, order: 6, width: '120px' },
      { field: 'hybrid_score', label: 'Hybrid Score', visible: true, order: 7, width: '120px' },
      { field: 'status', label: 'Status', visible: true, order: 8, width: '140px' },
      { field: 'date_found', label: 'Date Found', visible: true, order: 9, width: '140px' },
      { field: 'date_posted', label: 'Date Posted', visible: false, order: 10, width: '140px' },
      { field: 'actions', label: 'Actions', visible: true, order: 11, width: '100px', pinned: 'right' }
    ],
    sorts: [{ field: 'date_found', direction: 'desc' }],
    filters: [],
    pageSize: 25,
    infiniteScroll: false
  },
  createdAt: new Date('2025-02-11T00:00:00Z').toISOString(),
  updatedAt: new Date('2025-02-11T00:00:00Z').toISOString(),
  tags: ['default', 'table', 'comprehensive']
}

export const HIGH_MATCH_OPPORTUNITIES_VIEWSET: ViewSet = {
  id: 'default-high-match-opportunities',
  name: 'High Match Opportunities',
  isDefault: false,
  isModified: false,
  description: 'Opportunities with match score >= 70',
  data: {
    layout: 'table',
    columns: [
      { field: 'title', label: 'Opportunity Title', visible: true, order: 0, width: '300px', pinned: 'left' },
      { field: 'company', label: 'Company', visible: true, order: 1, width: '200px' },
      { field: 'match_score', label: 'Match Score', visible: true, order: 2, width: '120px' },
      { field: 'hybrid_score', label: 'Hybrid Score', visible: true, order: 3, width: '120px' },
      { field: 'location', label: 'Location', visible: true, order: 4, width: '180px' },
      { field: 'salary', label: 'Salary Range', visible: true, order: 5, width: '150px' },
      { field: 'status', label: 'Status', visible: true, order: 6, width: '140px' },
      { field: 'date_found', label: 'Date Found', visible: true, order: 7, width: '140px' }
    ],
    filters: [{ field: 'match_score', operator: 'gte', value: 70 }],
    sorts: [{ field: 'match_score', direction: 'desc' }],
    pageSize: 25,
    infiniteScroll: false
  },
  createdAt: new Date('2025-02-11T00:00:00Z').toISOString(),
  updatedAt: new Date('2025-02-11T00:00:00Z').toISOString(),
  tags: ['default', 'table', 'filtered', 'high-match']
}

export const DEFAULT_OPPORTUNITIES_VIEWSETS: ViewSet[] = [
  OPPORTUNITIES_PIPELINE_VIEWSET,
  OPPORTUNITIES_TABLE_VIEWSET,
  HIGH_MATCH_OPPORTUNITIES_VIEWSET
]

export function getDefaultViewSets(dataSourceId: string): ViewSet[] {
  switch (dataSourceId) {
    case 'opportunities.mainList':
      return DEFAULT_OPPORTUNITIES_VIEWSETS
    default:
      return []
  }
}

export function getDefaultViewSet(dataSourceId: string): ViewSet | undefined {
  const viewSets = getDefaultViewSets(dataSourceId)
  return viewSets.find(vs => vs.isDefault)
}
