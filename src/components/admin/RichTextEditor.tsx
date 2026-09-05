import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Link2,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  RemoveFormatting,
  Code,
  Eye,
  Plus,
  Loader2,
  Trash2,
  X,
  Check,
  Maximize2,
  Minimize2,
  Sliders,
  Move
} from 'lucide-react';
import { isHtmlContent, plainTextToHtml } from '../../utils/sanitizeHtml';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

type SizePreset = 'small' | 'medium' | 'large' | 'original' | 'custom';
type AlignOption = 'left' | 'center' | 'right';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write detailed specifications, fabric details, sizing recommendations...',
  minHeight = '260px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Link Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const savedSelectionRef = useRef<Range | null>(null);

  // Selected Image & Resize System State
  const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);
  const [activePreset, setActivePreset] = useState<SizePreset>('medium');
  const [customWidth, setCustomWidth] = useState<number>(480);
  const [currentAlign, setCurrentAlign] = useState<AlignOption>('center');
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [dragHandlePos, setDragHandlePos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Sync incoming value to editor contentEditable div
  useEffect(() => {
    if (!editorRef.current) return;
    const formatted = isHtmlContent(value) ? value : plainTextToHtml(value);

    if (editorRef.current.innerHTML !== formatted) {
      editorRef.current.innerHTML = formatted;
    }
  }, [value]);

  // Update drag handle position whenever selected image moves or resizes
  const updateDragHandlePosition = () => {
    if (!selectedImgEl || !containerRef.current) {
      setDragHandlePos(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = selectedImgEl.getBoundingClientRect();

    setDragHandlePos({
      top: imgRect.top - containerRect.top + imgRect.height - 14,
      left: imgRect.left - containerRect.left + imgRect.width - 14,
      width: imgRect.width,
      height: imgRect.height
    });
  };

  useEffect(() => {
    if (selectedImgEl) {
      updateDragHandlePosition();
      window.addEventListener('resize', updateDragHandlePosition);
      const editorEl = editorRef.current;
      if (editorEl) editorEl.addEventListener('scroll', updateDragHandlePosition);
      return () => {
        window.removeEventListener('resize', updateDragHandlePosition);
        if (editorEl) editorEl.removeEventListener('scroll', updateDragHandlePosition);
      };
    } else {
      setDragHandlePos(null);
    }
  }, [selectedImgEl, customWidth, currentAlign]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!savedSelectionRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  // Open Link Modal
  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setLinkNewTab(true);
    setLinkModalOpen(true);
  };

  // Insert Link
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    restoreSelection();
    editorRef.current?.focus();

    let cleanUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl) && !cleanUrl.startsWith('/') && !cleanUrl.startsWith('mailto:')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (linkText.trim()) {
      const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      const anchorHtml = `<a href="${cleanUrl}"${targetAttr}>${linkText.trim()}</a>`;
      document.execCommand('insertHTML', false, anchorHtml);
    } else {
      document.execCommand('createLink', false, cleanUrl);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    setLinkModalOpen(false);
  };

  // Remove Link
  const handleUnlink = () => {
    executeCommand('unlink');
  };

  // Upload and Insert Image directly
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Supported formats: JPG, PNG, WebP');
      return;
    }

    setUploadError('');
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64data,
            filename: file.name
          })
        });
        const data = await res.json();
        if (data.success && data.url) {
          insertImageHtml(data.url, file.name);
        } else {
          setUploadError(data.message || 'Upload failed');
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('Upload failed');
      setUploadingImage(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertImageHtml = (url: string, altText: string = 'Jersey specification image') => {
    editorRef.current?.focus();
    // Default: Medium (480px) centered
    const imageMarkup = `
      <figure class="my-4 text-center select-none" style="text-align: center;">
        <img 
          src="${url}" 
          alt="${altText}" 
          data-size-preset="medium"
          style="display: block; margin: 1rem auto; width: 480px; max-width: 100%; height: auto; border-radius: 0.75rem; float: none;" 
        />
      </figure>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, imageMarkup);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Toggle Source Code Mode
  const toggleSourceMode = () => {
    if (!isSourceMode) {
      setSourceCode(editorRef.current?.innerHTML || '');
      setIsSourceMode(true);
      deselectImage();
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceCode;
      }
      onChange(sourceCode);
      setIsSourceMode(false);
    }
  };

  // Click on contentEditable elements (detect img clicks)
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      selectImage(img);
    } else {
      deselectImage();
    }
  };

  const selectImage = (img: HTMLImageElement) => {
    if (selectedImgEl && selectedImgEl !== img) {
      selectedImgEl.removeAttribute('data-selected');
    }
    img.setAttribute('data-selected', 'true');
    setSelectedImgEl(img);

    // Detect size preset or width
    const preset = img.getAttribute('data-size-preset') as SizePreset | null;
    const styleWidth = img.style.width;
    let computedWidth = parseInt(styleWidth) || img.clientWidth || 480;

    if (preset && ['small', 'medium', 'large', 'original', 'custom'].includes(preset)) {
      setActivePreset(preset);
    } else if (styleWidth === '100%') {
      setActivePreset('original');
    } else if (computedWidth <= 280) {
      setActivePreset('small');
    } else if (computedWidth <= 520) {
      setActivePreset('medium');
    } else if (computedWidth <= 760) {
      setActivePreset('large');
    } else {
      setActivePreset('custom');
    }

    setCustomWidth(computedWidth);

    // Detect alignment
    if (img.style.float === 'left') {
      setCurrentAlign('left');
    } else if (img.style.float === 'right') {
      setCurrentAlign('right');
    } else {
      setCurrentAlign('center');
    }
  };

  const deselectImage = () => {
    if (selectedImgEl) {
      selectedImgEl.removeAttribute('data-selected');
      setSelectedImgEl(null);
      setDragHandlePos(null);
    }
  };

  // Apply Size Preset
  const handlePresetSelect = (preset: SizePreset) => {
    if (!selectedImgEl) return;
    setActivePreset(preset);

    if (preset === 'small') {
      applyImageWidth(240, 'small');
    } else if (preset === 'medium') {
      applyImageWidth(480, 'medium');
    } else if (preset === 'large') {
      applyImageWidth(720, 'large');
    } else if (preset === 'original') {
      selectedImgEl.style.width = '100%';
      selectedImgEl.style.maxWidth = '100%';
      selectedImgEl.style.height = 'auto';
      selectedImgEl.setAttribute('data-size-preset', 'original');
      setCustomWidth(selectedImgEl.naturalWidth || 800);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      updateDragHandlePosition();
    } else if (preset === 'custom') {
      applyImageWidth(customWidth, 'custom');
    }
  };

  // Apply Width in pixels
  const applyImageWidth = (width: number, preset: SizePreset = 'custom') => {
    if (!selectedImgEl) return;
    const clamped = Math.max(80, Math.min(1100, Math.round(width)));
    setCustomWidth(clamped);
    setActivePreset(preset);

    selectedImgEl.style.width = `${clamped}px`;
    selectedImgEl.style.maxWidth = '100%';
    selectedImgEl.style.height = 'auto';
    selectedImgEl.setAttribute('data-size-preset', preset);

    if (editorRef.current) onChange(editorRef.current.innerHTML);
    updateDragHandlePosition();
  };

  // Apply Alignment
  const handleAlignSelect = (align: AlignOption) => {
    if (!selectedImgEl) return;
    setCurrentAlign(align);

    const parentFigure = selectedImgEl.closest('figure');

    if (align === 'center') {
      selectedImgEl.style.display = 'block';
      selectedImgEl.style.margin = '1rem auto';
      selectedImgEl.style.float = 'none';
      if (parentFigure) parentFigure.style.textAlign = 'center';
    } else if (align === 'left') {
      selectedImgEl.style.display = 'inline-block';
      selectedImgEl.style.margin = '0.5rem 1.25rem 0.5rem 0';
      selectedImgEl.style.float = 'left';
      if (parentFigure) parentFigure.style.textAlign = 'left';
    } else if (align === 'right') {
      selectedImgEl.style.display = 'inline-block';
      selectedImgEl.style.margin = '0.5rem 0 0.5rem 1.25rem';
      selectedImgEl.style.float = 'right';
      if (parentFigure) parentFigure.style.textAlign = 'right';
    }

    if (editorRef.current) onChange(editorRef.current.innerHTML);
    updateDragHandlePosition();
  };

  // Delete Selected Image
  const handleDeleteSelectedImage = () => {
    if (!selectedImgEl) return;
    const parentFigure = selectedImgEl.closest('figure');
    if (parentFigure) {
      parentFigure.remove();
    } else {
      selectedImgEl.remove();
    }
    setSelectedImgEl(null);
    setDragHandlePos(null);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // Corner Drag Resize Handler
  const handleDragResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImgEl) return;

    setIsDraggingResize(true);
    const startX = e.clientX;
    const startWidth = selectedImgEl.clientWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(80, Math.min(1100, Math.round(startWidth + deltaX)));
      selectedImgEl.style.width = `${newWidth}px`;
      selectedImgEl.style.maxWidth = '100%';
      selectedImgEl.style.height = 'auto';
      selectedImgEl.setAttribute('data-size-preset', 'custom');
      setCustomWidth(newWidth);
      setActivePreset('custom');
      updateDragHandlePosition();
    };

    const onPointerUp = () => {
      setIsDraggingResize(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      updateDragHandlePosition();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={containerRef}
      className="relative border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 rich-editor-container"
    >
      {/* MAIN TOOLBAR */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-1 sm:gap-1.5 text-slate-700 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="px-2 py-1 rounded-lg text-xs font-black hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="px-2 py-1 rounded-lg text-xs font-black hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h3>')}
            className="px-2 py-1 rounded-lg text-xs font-black hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<p>')}
            className="px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Paragraph"
          >
            P
          </button>
        </div>

        {/* Text Styles */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignments */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => executeCommand('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyFull')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={openLinkModal}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Insert Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleUnlink}
            className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Remove Link"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Image Upload Button */}
        <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200">
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black cursor-pointer transition-colors shadow-2xs border border-emerald-200">
            {uploadingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{uploadingImage ? 'Uploading...' : 'Add Image'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploadingImage || isSourceMode}
              className="hidden"
            />
          </label>
        </div>

        {/* Clear formatting & Source Code Toggle */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            type="button"
            onClick={() => executeCommand('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-white hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleSourceMode}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
              isSourceMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle HTML Source"
          >
            {isSourceMode ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{isSourceMode ? 'Visual' : 'HTML'}</span>
          </button>
        </div>
      </div>

      {/* DEDICATED IMAGE RESIZE & FORMATTING INSPECTOR BAR */}
      {selectedImgEl && (
        <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-inner animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Image Indicator */}
            <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold pr-2 border-r border-slate-700 text-[11px]">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image ({customWidth}px)</span>
            </div>

            {/* Size Preset Buttons */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 px-1.5">Size:</span>
              <button
                type="button"
                onClick={() => handlePresetSelect('small')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  activePreset === 'small'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Small (240px)"
              >
                Small
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('medium')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  activePreset === 'medium'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Medium (480px)"
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('large')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  activePreset === 'large'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Large (720px)"
              >
                Large
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('original')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  activePreset === 'original'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Original (100% full width)"
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('custom')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  activePreset === 'custom'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Custom pixel width"
              >
                Custom
              </button>
            </div>

            {/* Custom Width Input */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400">Width:</span>
              <input
                type="number"
                min={80}
                max={1100}
                value={customWidth}
                onChange={(e) => applyImageWidth(Number(e.target.value) || 100, 'custom')}
                className="w-14 bg-slate-900 text-white text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-700 text-center outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 font-medium">px</span>
              <span className="text-[10px] text-slate-500 mx-1">|</span>
              <span className="text-[10px] font-bold text-slate-400">Height:</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Auto</span>
            </div>

            {/* Alignment Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 px-1.5">Align:</span>
              <button
                type="button"
                onClick={() => handleAlignSelect('left')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  currentAlign === 'left'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => handleAlignSelect('center')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  currentAlign === 'center'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => handleAlignSelect('right')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors border-none ${
                  currentAlign === 'right'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Right
              </button>
            </div>
          </div>

          {/* Delete and Done */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleDeleteSelectedImage}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-black text-[11px] px-2.5 py-1 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer bg-transparent border border-red-900/40"
              title="Delete Image"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={deselectImage}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-bold text-[11px] px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer bg-transparent border border-slate-700"
              title="Done editing image"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-red-500 hover:text-red-700 cursor-pointer border-none bg-transparent"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="relative">
        {isSourceMode ? (
          <textarea
            value={sourceCode}
            onChange={(e) => {
              setSourceCode(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900/5 leading-relaxed outline-none resize-y"
            style={{ minHeight }}
            placeholder="Edit raw HTML..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onClick={handleEditorClick}
            className="rich-description rich-editor-content p-4 sm:p-5 outline-none overflow-y-auto focus:bg-white"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}

        {/* CORNER DRAG RESIZE HANDLE OVERLAY */}
        {selectedImgEl && dragHandlePos && !isSourceMode && (
          <div
            onPointerDown={handleDragResizeStart}
            className={`absolute z-30 w-5 h-5 bg-emerald-600 border-2 border-white rounded-md shadow-md flex items-center justify-center cursor-se-resize select-none touch-none transition-transform hover:scale-125 ${
              isDraggingResize ? 'scale-125 bg-emerald-700 ring-2 ring-emerald-400' : ''
            }`}
            style={{
              top: `${dragHandlePos.top}px`,
              left: `${dragHandlePos.left}px`
            }}
            title="Drag corner to resize image"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-2xs" />
          </div>
        )}
      </div>

      {/* LINK INSERTION MODAL */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-emerald-600" />
                <span>Insert Hyperlink</span>
              </h4>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Link Text (Optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. View Sizing Guide"
                  className="w-full border border-slate-200 p-2 rounded-xl text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Target URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/guide or /size-chart"
                  required
                  autoFocus
                  className="w-full border border-slate-200 p-2 rounded-xl text-slate-900 outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 font-semibold">Open link in a new tab (target=&quot;_blank&quot;)</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer border-none shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Insert Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
