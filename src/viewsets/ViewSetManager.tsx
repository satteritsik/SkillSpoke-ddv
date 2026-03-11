import React, { useState } from 'react'
import type { ViewSet, ViewSetManagerProps, ViewSetExport } from './ViewSetTypes'

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const DuplicateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const ResetIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)

/**
 * ViewSetManager Component
 *
 * Manages saved ViewSets (layouts, filters, sorts, columns) for DynamicDataViewPanel.
 * Supports switch, save, rename, delete, duplicate, import, and export operations.
 */
export const ViewSetManager: React.FC<ViewSetManagerProps> = ({
  dataSourceId,
  currentViewSet,
  viewSets,
  hasUnsavedChanges,
  onViewSetSelect,
  onSaveChanges,
  onCreateNew,
  onRename,
  onDelete,
  onResetToDefault,
  onDuplicate,
  onImport,
  className = '',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [createValue, setCreateValue] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [duplicateName, setDuplicateName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try { await onSaveChanges() } finally { setIsSaving(false) }
  }

  const handleRename = async () => {
    if (!renameValue.trim()) return
    setIsSaving(true)
    try {
      await onRename(currentViewSet.id, renameValue.trim())
      setIsRenameDialogOpen(false)
      setRenameValue('')
    } finally { setIsSaving(false) }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(currentViewSet.id)
      setIsDeleteDialogOpen(false)
    } finally { setIsDeleting(false) }
  }

  const handleCreate = async () => {
    if (!createValue.trim()) return
    setIsCreating(true)
    try {
      await onCreateNew(createValue.trim(), createDescription.trim() || undefined)
      setIsCreateDialogOpen(false)
      setCreateValue('')
      setCreateDescription('')
      setIsDropdownOpen(false)
    } finally { setIsCreating(false) }
  }

  const handleDuplicate = async () => {
    if (!duplicateName.trim() || !onDuplicate) return
    setIsDuplicating(true)
    try {
      await onDuplicate(currentViewSet.id, duplicateName.trim())
      setIsDuplicateDialogOpen(false)
      setDuplicateName('')
    } finally { setIsDuplicating(false) }
  }

  const handleViewSetSelect = (viewSet: ViewSet) => {
    onViewSetSelect(viewSet)
    setIsDropdownOpen(false)
  }

  const handleExport = () => {
    const exportData: ViewSetExport = {
      version: '1.0',
      type: 'viewset',
      viewSet: currentViewSet,
      exportedAt: new Date().toISOString(),
      metadata: { dataSourceId },
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `viewset-${currentViewSet.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = JSON.parse(text) as ViewSetExport
      if (imported.type !== 'viewset') { alert('Invalid ViewSet file: incorrect type'); return }
      if (!imported.viewSet?.data) { alert('Invalid ViewSet file: missing data'); return }
      const importedViewSet: ViewSet = {
        ...imported.viewSet,
        id: `imported-${Date.now()}`,
        name: `${imported.viewSet.name} (Imported)`,
        isDefault: false,
        isModified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      if (onImport) onImport(importedViewSet)
    } catch (error) {
      console.error('Failed to import ViewSet:', error)
      alert('Failed to import ViewSet. Please check the file format.')
    }
    event.target.value = ''
  }

  return (
    <div className={`ddv-viewset-manager ${className}`}>
      <div className="ddv-viewset-dropdown-wrapper">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="ddv-viewset-selector"
        >
          <span>{currentViewSet.name}</span>
          {hasUnsavedChanges && <span className="ddv-unsaved-dot" title="Unsaved changes" />}
          {currentViewSet.isDefault && <span className="ddv-default-label">(Default)</span>}
          <ChevronDownIcon className={`ddv-icon ${isDropdownOpen ? 'ddv-icon--rotated' : ''}`} />
        </button>

        {isDropdownOpen && (
          <>
            <div className="ddv-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />
            <div className="ddv-dropdown">
              <div className="ddv-dropdown-list">
                {viewSets.map((viewSet) => (
                  <button
                    key={viewSet.id}
                    type="button"
                    onClick={() => handleViewSetSelect(viewSet)}
                    className="ddv-dropdown-item"
                  >
                    <span>
                      {viewSet.name}
                      {viewSet.isDefault && <span className="ddv-default-label"> (Default)</span>}
                    </span>
                    {viewSet.id === currentViewSet.id && <CheckIcon className="ddv-icon ddv-icon--active" />}
                  </button>
                ))}
              </div>
              <div className="ddv-dropdown-divider" />
              <div className="ddv-dropdown-actions">
                <button
                  type="button"
                  onClick={() => { setIsCreateDialogOpen(true); setIsDropdownOpen(false) }}
                  className="ddv-dropdown-item"
                >
                  <PlusIcon className="ddv-icon" />
                  Create New ViewSet
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="ddv-viewset-actions">
        {hasUnsavedChanges && (
          <button type="button" onClick={handleSaveChanges} disabled={isSaving} className="ddv-action-btn" title="Save changes">
            <CheckIcon className={`ddv-icon ${isSaving ? 'ddv-icon--pulsing' : ''}`} />
          </button>
        )}
        <button type="button" onClick={() => { setRenameValue(currentViewSet.name); setIsRenameDialogOpen(true) }} disabled={currentViewSet.isDefault} className="ddv-action-btn" title="Rename">
          <PencilIcon className="ddv-icon" />
        </button>
        {onDuplicate && (
          <button type="button" onClick={() => { setDuplicateName(`${currentViewSet.name} (Copy)`); setIsDuplicateDialogOpen(true) }} className="ddv-action-btn" title="Duplicate">
            <DuplicateIcon className="ddv-icon" />
          </button>
        )}
        <button type="button" onClick={() => setIsDeleteDialogOpen(true)} disabled={currentViewSet.isDefault} className="ddv-action-btn" title="Delete">
          <TrashIcon className="ddv-icon" />
        </button>
        <button type="button" onClick={onResetToDefault} className="ddv-action-btn" title="Reset to default">
          <ResetIcon className="ddv-icon" />
        </button>
        <button type="button" onClick={handleExport} className="ddv-action-btn" title="Export">
          <DownloadIcon className="ddv-icon" />
        </button>
        <label className="ddv-action-btn" title="Import">
          <UploadIcon className="ddv-icon" />
          <input type="file" accept=".json" onChange={handleImport} className="ddv-hidden-input" />
        </label>
      </div>

      {isRenameDialogOpen && (
        <div className="ddv-dialog-overlay">
          <div className="ddv-dialog">
            <h3 className="ddv-dialog-title">Rename ViewSet</h3>
            <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="ddv-dialog-input" placeholder="ViewSet name" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenameDialogOpen(false) }} />
            <div className="ddv-dialog-actions">
              <button type="button" onClick={() => setIsRenameDialogOpen(false)} className="ddv-dialog-btn ddv-dialog-btn--secondary">Cancel</button>
              <button type="button" onClick={handleRename} disabled={!renameValue.trim() || isSaving} className="ddv-dialog-btn ddv-dialog-btn--primary">
                {isSaving ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="ddv-dialog-overlay">
          <div className="ddv-dialog">
            <h3 className="ddv-dialog-title">Delete ViewSet</h3>
            <p>Are you sure you want to delete "{currentViewSet.name}"? This cannot be undone.</p>
            <div className="ddv-dialog-actions">
              <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="ddv-dialog-btn ddv-dialog-btn--secondary">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="ddv-dialog-btn ddv-dialog-btn--danger">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateDialogOpen && (
        <div className="ddv-dialog-overlay">
          <div className="ddv-dialog">
            <h3 className="ddv-dialog-title">Create New ViewSet</h3>
            <input type="text" value={createValue} onChange={(e) => setCreateValue(e.target.value)} className="ddv-dialog-input" placeholder="ViewSet name" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsCreateDialogOpen(false) }} />
            <textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} className="ddv-dialog-input" placeholder="Description (optional)" rows={3} />
            <div className="ddv-dialog-actions">
              <button type="button" onClick={() => setIsCreateDialogOpen(false)} className="ddv-dialog-btn ddv-dialog-btn--secondary">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={!createValue.trim() || isCreating} className="ddv-dialog-btn ddv-dialog-btn--primary">
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDuplicateDialogOpen && (
        <div className="ddv-dialog-overlay">
          <div className="ddv-dialog">
            <h3 className="ddv-dialog-title">Duplicate ViewSet</h3>
            <input type="text" value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} className="ddv-dialog-input" placeholder="New ViewSet name" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleDuplicate(); if (e.key === 'Escape') setIsDuplicateDialogOpen(false) }} />
            <div className="ddv-dialog-actions">
              <button type="button" onClick={() => setIsDuplicateDialogOpen(false)} className="ddv-dialog-btn ddv-dialog-btn--secondary">Cancel</button>
              <button type="button" onClick={handleDuplicate} disabled={!duplicateName.trim() || isDuplicating} className="ddv-dialog-btn ddv-dialog-btn--primary">
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
