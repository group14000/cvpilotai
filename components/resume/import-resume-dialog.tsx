'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useResumeStore } from '@/store/resume-store';
import { useImportResume } from '@/hooks/use-import-resume';
import type { ImportedResumeData } from '@/features/resume/services/importService';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_EXTENSIONS = '.pdf,.docx';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  templateSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ─── State type ───────────────────────────────────────────────────────────────

type DialogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ImportedResumeData }
  | { status: 'error'; message: string };

/**
 * Import resume dialog with four states:
 *
 * 1. Idle    — drag-and-drop / click-to-browse upload zone
 * 2. Loading — spinner while AI extracts and normalizes the resume
 * 3. Success — summary of what was imported + "Continue to Editor" button
 * 4. Error   — specific error message + "Try Again" button
 *
 * On success, the user clicks "Continue to Editor" which calls hydrateResume()
 * on the Zustand store. The editor is immediately populated. The user reviews,
 * edits, and saves using the existing Save button.
 */
export function ImportResumeDialog({
  templateSlug,
  open,
  onOpenChange,
}: Props) {
  const [dialogState, setDialogState] = useState<DialogState>({
    status: 'idle',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hydrateResume = useResumeStore((s) => s.hydrateResume);
  const { mutate: importResume, isPending } = useImportResume();

  // ── Client-side file validation ─────────────────────────────────────────────
  function validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE_BYTES)
      return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
    if (!ACCEPTED_MIME_TYPES.includes(file.type))
      return 'Only PDF and DOCX files are supported.';
    return null;
  }

  // ── Handle file selection ───────────────────────────────────────────────────
  function handleFileSelect(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setDialogState({ status: 'error', message: validationError });
      return;
    }
    setSelectedFile(file);
    setDialogState({ status: 'idle' });
  }

  // ── Handle import submission ────────────────────────────────────────────────
  function handleImport() {
    if (!selectedFile) return;

    setDialogState({ status: 'loading' });

    importResume(selectedFile, {
      onSuccess: (data) => {
        setDialogState({ status: 'success', data });
      },
      onError: (error: Error) => {
        setDialogState({
          status: 'error',
          message: error.message || 'Import failed. Please try again.',
        });
      },
    });
  }

  // ── Continue to editor ──────────────────────────────────────────────────────
  function handleContinue() {
    if (dialogState.status !== 'success') return;
    hydrateResume({
      ...dialogState.data,
      id: 'preview-draft',
      templateId: templateSlug,
    });
    onOpenChange(false);
    // Reset for next use
    setDialogState({ status: 'idle' });
    setSelectedFile(null);
  }

  // ── Reset to idle ───────────────────────────────────────────────────────────
  function handleReset() {
    setDialogState({ status: 'idle' });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Close guard — prevent close during loading ──────────────────────────────
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return;
    if (!nextOpen) {
      setDialogState({ status: 'idle' });
      setSelectedFile(null);
    }
    onOpenChange(nextOpen);
  }

  // ── Drag and drop handlers ──────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Summary stats for success state ────────────────────────────────────────
  function getImportSummary(data: ImportedResumeData) {
    return [
      data.personalInfo.firstName || data.personalInfo.lastName
        ? `${data.personalInfo.firstName} ${data.personalInfo.lastName}`.trim()
        : null,
      data.experiences.length > 0
        ? `${data.experiences.length} experience${data.experiences.length !== 1 ? 's' : ''}`
        : null,
      data.education.length > 0
        ? `${data.education.length} education${data.education.length !== 1 ? 's' : ''}`
        : null,
      data.skills.length > 0
        ? `${data.skills.length} skill${data.skills.length !== 1 ? 's' : ''}`
        : null,
      data.projects.length > 0
        ? `${data.projects.length} project${data.projects.length !== 1 ? 's' : ''}`
        : null,
    ].filter(Boolean);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Existing Resume
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {/* ── Idle state ── */}
          {(dialogState.status === 'idle' ||
            dialogState.status === 'error') && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    fileInputRef.current?.click();
                }}
              >
                {selectedFile ? (
                  <div className="space-y-1">
                    <FileText className="text-primary mx-auto h-8 w-8" />
                    <p className="text-foreground text-sm font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(selectedFile.size / 1024).toFixed(0)} KB — click to
                      change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="text-muted-foreground mx-auto h-8 w-8" />
                    <div>
                      <p className="text-sm font-medium">
                        Drop your resume here or click to browse
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        PDF or DOCX · Max {MAX_FILE_SIZE_MB} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {/* Error message */}
              {dialogState.status === 'error' && (
                <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md px-3 py-2.5 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{dialogState.message}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedFile}
                  onClick={handleImport}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import Resume
                </Button>
              </div>
            </div>
          )}

          {/* ── Loading state ── */}
          {dialogState.status === 'loading' && (
            <div className="space-y-5 py-4 text-center">
              <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
              <div>
                <p className="text-sm font-medium">Analyzing your resume...</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  The AI is extracting and normalizing your resume data.
                  <br />
                  This usually takes 10–20 seconds.
                </p>
              </div>
            </div>
          )}

          {/* ── Success state ── */}
          {dialogState.status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md bg-green-500/10 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Resume imported successfully
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {getImportSummary(dialogState.data).map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-green-700 dark:text-green-400"
                      >
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                Review and edit the imported data in the editor. Empty fields
                can be filled in before saving.
              </p>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-1.5"
                  onClick={handleReset}
                >
                  <X className="h-3.5 w-3.5" />
                  Import a different file
                </Button>
                <Button size="sm" onClick={handleContinue} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Continue to Editor
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
