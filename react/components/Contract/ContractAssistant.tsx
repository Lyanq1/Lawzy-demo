import React, { useState, useEffect } from 'react'
import ContractUpload from './ContractUpload'
import PDFViewer from './PDFViewer'
import { useDispatch } from 'react-redux'
import { setExtractedTextRedux } from '../../store/slices/extractedSlice'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface WarningItemProps {
  warning: string
  expanded?: boolean
}

// Interface cho tab điều hướng
interface NavTab {
  id: string
  label: string
  icon: React.ReactNode
}

// Interface cho tài liệu đã tải lên
interface UploadedDocument {
  id: string
  name: string
  date: string
  size: string
}

// Interface cho mục ghi chú của bản thân
interface Note {
  id: string
  text: string
  completed: boolean
}

const WarningItem: React.FC<WarningItemProps> = ({ warning }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
      <div
        className='flex items-start justify-between p-4 cursor-pointer bg-white hover:bg-gray-50'
        onClick={() => setExpanded(!expanded)}
      >
        <div className='flex items-start gap-3'>
          <div className='mt-0.5'>
            <svg className='h-5 w-5 text-orange-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
          <div>
            <div className='text-sm font-medium text-gray-800'>{warning}</div>
            <div className='text-xs text-orange-500 font-medium mt-1'>NEEDS REVIEW</div>
          </div>
        </div>
        <div className='text-gray-400'>
          {expanded ? (
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
            </svg>
          ) : (
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          )}
        </div>
      </div>

      {expanded && (
        <div className='p-4 border-t border-gray-200 bg-gray-50'>
          <div className='mb-2 text-sm font-medium text-gray-700'>Đề xuất</div>
          <div className='p-3 bg-white rounded border border-gray-200 text-sm'>
            <div className='flex items-start gap-2'>
              <svg className='h-4 w-4 text-indigo-500 mt-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                />
              </svg>
              <div>
                <p className='text-gray-700'>
                  {' '}
                  <span className='text-orange-500 font-medium'>Nội dung hợp đồng</span>...
                </p>
                <div className='mt-4'>
                  <div className='text-xs text-indigo-500 font-medium mb-2'>Suggested edits</div>
                  <p className='text-gray-700'>
                    {' '}
                    <span className='line-through text-gray-500'>Nội dung</span>,{' '}
                    <span className='text-indigo-600 font-medium'>Văn bản</span> này...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component hiển thị tài liệu đã tải lên
const DocumentItem: React.FC<{ document: UploadedDocument; isActive: boolean; onClick: () => void }> = ({
  document,
  isActive,
  onClick
}) => {
  return (
    <div
      className={`p-3 border-b cursor-pointer transition-colors duration-200 ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-blue-100 rounded-lg'>
          <svg className='h-5 w-5 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-800 truncate'>{document.name}</p>
          <div className='flex items-center text-xs text-gray-500 mt-1'>
            <span>{document.date}</span>
            <span className='mx-1'>•</span>
            <span>{document.size}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ContractAssistant: React.FC<Props> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()

  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showVerticalScan, setShowVerticalScan] = useState(false)
  const [verticalScanProgress, setVerticalScanProgress] = useState(0)
  const [showExtractedText, setShowExtractedText] = useState(false)
  const [extractedTextTemp, setExtractedTextTemp] = useState('')
  const [textOpacity, setTextOpacity] = useState(0)

  // State cho tab điều hướng
  const [activeTab, setActiveTab] = useState<string>('content')

  // State cho tài liệu đã tải lên
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [activeDocument, setActiveDocument] = useState<string | null>(null)

  // State cho mục Note
  const handleSend = () => {
    if (newNote.trim()) {
      setNotes([{ id: Date.now().toString(), text: newNote.trim(), completed: false }, ...notes])
      setNewNote('')
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('contract_notes')
    if (stored) {
      setNotes(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('contract_notes', JSON.stringify(notes))
  }, [notes])
  // Tabs điều hướng
  const navTabs: NavTab[] = [
    {
      id: 'content',
      label: 'Nội dung',
      icon: (
        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      )
    },
    {
      id: 'documents',
      label: 'Tài liệu đã tải lên',
      icon: (
        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
          />
        </svg>
      )
    },
    {
      id: 'note',
      label: 'Ghi chú',
      // icon: <img className=' pt-0.5 h-5 w-5' src='assets/notes.svg' alt='note icon' />
      icon: (
        <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            d='M4 6H20M4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6M4 6H14M14 6V4C14 2.89543 14.8954 2 16 2H18C19.1046 2 20 2.89543 20 4V6M10 12H16M10 16H16'
            strokeWidth={2}
            stroke-linecap='round'
            stroke-linejoin='round'
          />
        </svg>
      )
    }
  ]

  // Theo dõi khi scanProgress đạt 100% để bắt đầu quét dọc ngay lập tức
  useEffect(() => {
    if (scanProgress >= 100 && loading) {
      // Khi tiến trình quét đạt 100%, kết thúc quá trình tải và bắt đầu quét dọc
      setLoading(false)
      setShowVerticalScan(true)
    }
  }, [scanProgress, loading])

  useEffect(() => {
    if (showVerticalScan) {
      // Animate vertical scan bar - tăng tốc độ quét
      let progress = 0
      const interval = setInterval(() => {
        progress += 2 // Tăng tốc độ quét
        setVerticalScanProgress(progress)

        if (progress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setShowVerticalScan(false)
            setShowExtractedText(true)
          }, 200) // Giảm thời gian chờ
        }
      }, 20) // Giảm thời gian giữa các bước

      return () => clearInterval(interval)
    }
  }, [showVerticalScan])

  // Fade in effect for text - tăng tốc độ hiển thị
  useEffect(() => {
    if (showExtractedText) {
      setTextOpacity(0)
      setTimeout(() => {
        setExtractedText(extractedTextTemp)
        setTextOpacity(100)
      }, 50) // Giảm thời gian chờ
    }
  }, [showExtractedText, extractedTextTemp])

  // Cập nhật danh sách tài liệu khi có file mới được tải lên
  useEffect(() => {
    if (uploadedFile) {
      const newDocument: UploadedDocument = {
        id: Date.now().toString(),
        name: uploadedFile.name,
        date: new Date().toLocaleDateString('vi-VN'),
        size: `${Math.round(uploadedFile.size / 1024)} KB`
      }

      setUploadedDocuments((prev) => [newDocument, ...prev])
      setActiveDocument(newDocument.id)
    }
  }, [uploadedFile])

  if (!isOpen) return null

  const handleFileProcessed = async (text: string, file: File | null) => {
    // Store the text temporarily but don't display it yet
    setExtractedTextTemp(text)
    setUploadedFile(file)
    dispatch(setExtractedTextRedux(text))
    console.log('📝 OCR Text:', text)

    try {
      const res = await fetch('https://platform.phoai.vn/webhook/chatbotContract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: 'contract-analysis'
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log('📌 Phản hồi từ chatbot:', data)
      // Xử lý 2 trường hợp: phản hồi trực tiếp hoặc được gói trong chuỗi JSON
      let parsed = data
      if (typeof data.output === 'string') {
        try {
          parsed = JSON.parse(data.output)
        } catch (err) {
          console.error('❌ Không thể parse output:', err)
        }
      }
      if (parsed?.suggestions && Array.isArray(parsed.suggestions)) {
        setWarnings(parsed.suggestions)
      } else {
        console.warn('⚠️ Phản hồi không có "suggestions" hợp lệ:', parsed)
      }
      if (parsed?.suggestions && Array.isArray(parsed.suggestions)) {
        setWarnings(parsed.suggestions)
      } else {
        console.warn('⚠️ Phản hồi không có "suggestions" hợp lệ:', parsed)
        // Nếu không có dữ liệu hợp lệ từ API, sử dụng dữ liệu mẫu để demo
        setWarnings([
          'Flag all dates',
          'If governing law is present in the agreement, set it to Commonwealth of Massachusetts',
          'Check for confidentiality clauses',
          'Verify payment terms and conditions'
        ])
      }
      console.log(scanProgress)
      // console.log(scanProgress)
    } catch (err) {
      console.error('❌ Lỗi gửi dữ liệu tới chatbot:', err)

      // Trong trường hợp lỗi, vẫn hiển thị dữ liệu mẫu để demo
      setWarnings([
        'Flag all dates',
        'If governing law is present in the agreement, set it to Commonwealth of Massachusetts',
        'Check for confidentiality clauses',
        'Verify payment terms and conditions'
      ])
    }
  }

  const handleStartProcessing = () => {
    setLoading(true)
    setScanProgress(0)
    setShowExtractedText(false)
    setExtractedText('')
    setTextOpacity(0)
    setShowVerticalScan(false)
    setVerticalScanProgress(0)
  }

  const handleProgress = (progress: number) => {
    setScanProgress(progress)
  }

  const handleDocumentClick = (docId: string) => {
    setActiveDocument(docId)
    // Ở đây có thể thêm logic để tải nội dung của tài liệu đã chọn
  }

  return (
    <div className='fixed inset-0 z-50 bg-[#fefff9] font-sans flex flex-col h-full'>
      <div className='p-4 border-b bg-[#fefff9] flex justify-between items-center'>
        <h1 className='text-2xl font-semibold text-gray-800'>Trợ lý hợp đồng</h1>
        <div className='flex items-center gap-4'>
          <ContractUpload
            onFileProcessed={handleFileProcessed}
            onProcessingStart={handleStartProcessing}
            onProgress={handleProgress}
          />
          <button onClick={onClose} className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm'>
            Quay lại
          </button>
        </div>
      </div>

      {loading && (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center'>
          <div className='w-full max-w-md mx-auto px-4'>
            <div className='bg-white rounded-lg shadow-lg p-4'>
              <div className='flex items-center mb-3'>
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                <span className='text-lg font-medium text-gray-700'>Đang quét tài liệu...</span>
              </div>
              <div className='relative w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='absolute top-0 left-0 h-full bg-blue-500'
                  style={{ width: `${scanProgress}%`, transition: 'width 0.2s linear' }}
                ></div>
                <div
                  className='absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-pulse'
                  style={{ left: `${Math.min(92, scanProgress)}%`, transition: 'left 0.2s linear' }}
                ></div>
              </div>
              <div className='mt-2 text-right'>
                <span className='text-sm font-medium text-blue-600'>{Math.round(scanProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='flex flex-1 overflow-hidden'>
        <div className='w-1/3 border-r p-4 overflow-auto bg-gray-50 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-800'>📝 Các mục cần lưu ý</h3>
            <div className='text-sm text-gray-600'>
              <span className='font-medium'>{warnings.length}</span>/
              <span className='font-medium'>{warnings.length}</span>
            </div>
          </div>
          {warnings.length > 0 ? (
            <div className='space-y-1'>
              {warnings.map((item, idx) => (
                <WarningItem key={idx} warning={item} />
              ))}
            </div>
          ) : (
            <div className='p-4 bg-white rounded-lg border border-gray-200 text-center'>
              <p className='text-gray-500 text-sm'>Chưa có cảnh báo nào, vui lòng tải hợp đồng.</p>
            </div>
          )}
        </div>

        <div className='flex-1 p-4 grid grid-cols-2 gap-4'>
          <div className='flex flex-col bg-white border rounded shadow-sm h-full min-h-32 relative'>
            <h3 className='text-sm font-semibold text-gray-800 p-2 border-b'>Xem trước PDF</h3>
            <div className='flex-1 overflow-auto relative'>
              <PDFViewer file={uploadedFile} />
              {showVerticalScan && (
                <div className='absolute inset-0 pointer-events-none'>
                  <div
                    className='absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 shadow-lg'
                    style={{
                      left: `${verticalScanProgress}%`,
                      boxShadow: '0 0 10px 3px rgba(59, 130, 246, 0.5)',
                      transition: 'left 0.03s linear'
                    }}
                  ></div>
                  <div
                    className='absolute inset-0 bg-gradient-to-r from-transparent to-blue-100/20'
                    style={{
                      clipPath: `polygon(0 0, ${verticalScanProgress}% 0, ${verticalScanProgress}% 100%, 0 100%)`,
                      transition: 'clip-path 0.03s linear'
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div className='flex flex-col bg-white border rounded shadow-sm h-full min-h-32'>
            <div className='flex border-b'>
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className='flex-1 overflow-hidden'>
              {activeTab === 'content' && (
                <div className='h-full overflow-auto p-2'>
                  {showExtractedText ? (
                    <pre
                      className='font-sans text-sm whitespace-pre-wrap transition-opacity duration-500'
                      style={{ opacity: textOpacity / 100 }}
                    >
                      {extractedText || 'Vui lòng tải lên hợp đồng để xem nội dung.'}
                    </pre>
                  ) : (
                    <div className='h-full flex items-center justify-center'>
                      <p className='text-gray-400 text-sm'>Đang phân tích nội dung...</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'documents' && (
                <div className='h-full overflow-auto'>
                  {uploadedDocuments.length > 0 ? (
                    <div>
                      {uploadedDocuments.map((doc) => (
                        <DocumentItem
                          key={doc.id}
                          document={doc}
                          isActive={doc.id === activeDocument}
                          onClick={() => handleDocumentClick(doc.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='h-full flex items-center justify-center p-4'>
                      <p className='text-gray-400 text-sm'>Chưa có tài liệu nào được tải lên.</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'note' && (
                <div className='h-full overflow-auto p-4 flex flex-col'>
                  <div className='mb-4'>
                    <div className='flex gap-2'>
                      <input
                        type='text'
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder='Nhập nội dung ghi chú...'
                        className='flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      />
                      <button
                        onClick={handleSend}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition'
                      >
                        Thêm
                      </button>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {notes.length === 0 ? (
                      <div className='text-sm text-gray-500 text-center mt-10'>
                        Chưa có ghi chú nào. Bắt đầu thêm một ghi chú mới.
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className={`flex items-start justify-between p-4 rounded-xl border transition ${
                            note.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          <div className='flex items-start gap-3 flex-1'>
                            <input
                              type='checkbox'
                              checked={note.completed}
                              onChange={() =>
                                setNotes(notes.map((t) => (t.id === note.id ? { ...t, completed: !t.completed } : t)))
                              }
                              className='mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                            />
                            <span
                              className={`text-sm leading-relaxed ${
                                note.completed ? 'line-through text-gray-400' : 'text-gray-800'
                              }`}
                            >
                              {note.text}
                            </span>
                          </div>
                          <button
                            onClick={() => setNotes(notes.filter((t) => t.id !== note.id))}
                            className='p-1 hover:bg-gray-100 rounded transition'
                            title='Xoá ghi chú'
                          >
                            <svg
                              className='w-4 h-4 text-gray-400 hover:text-red-500 transition'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth={2}
                              viewBox='0 0 24 24'
                            >
                              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractAssistant
