import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, Image as ImageIcon, Music, Video, X, CheckCircle } from 'lucide-react'
import { formatBytes } from '../utils/format'

export default function FileDropzone({
  file,
  onFileSelect,
  onFileClear,
  progress = null,
  disabled = false,
  error = null
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  const getFileIcon = (fileObj) => {
    const type = fileObj?.type || ''
    const name = fileObj?.name?.toLowerCase() || ''
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name)) {
      return <ImageIcon className="h-8 w-8 text-cyan-400" />
    }
    if (type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg)$/.test(name)) {
      return <Music className="h-8 w-8 text-purple-400" />
    }
    if (type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) {
      return <Video className="h-8 w-8 text-blue-400" />
    }
    return <FileText className="h-8 w-8 text-emerald-400" />
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
              : error
              ? 'border-red-500/50 bg-red-950/20'
              : 'border-slate-700/80 hover:border-cyan-500/40 bg-slate-900/40 hover:bg-slate-900/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3 shadow-inner">
            <UploadCloud className="h-7 w-7 animate-bounce" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Kéo thả tệp chứng cứ vào đây hoặc <span className="text-cyan-400 underline">chọn tệp</span>
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            Hỗ trợ: Ảnh (.jpg, .png), Âm thanh (.mp3, .wav), Video (.mp4), PDF, Word (.docx)
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono-code">
            Dung lượng tối đa: 200 MB
          </p>
          {error && (
            <p className="mt-2 text-xs font-semibold text-red-400 animate-in fade-in">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-cyan-500/30 bg-[#131a33]/90 p-4 shadow-lg shadow-black/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700">
                {getFileIcon(file)}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-sm font-semibold text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-code mt-0.5">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span className="truncate max-w-[140px]">{file.type || 'binary/raw'}</span>
                </div>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={onFileClear}
                title="Chọn tệp khác"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Progress bar during upload */}
          {progress !== null && (
            <div className="mt-3.5 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 font-mono-code mb-1">
                <span>Đang tải lên...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
