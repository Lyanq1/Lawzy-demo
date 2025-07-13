import React, { useState } from 'react'
import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'
import { toast } from 'sonner' // Ensure 'sonner' is imported here

// Set worker to local static file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface Props {
  onFileProcessed: (text: string, file: File | null) => void
  onProcessingStart?: () => void
  onProgress?: (progress: number) => void
}

const ContractUpload: React.FC<Props> = ({ onFileProcessed, onProcessingStart, onProgress }) => {
  const [loading, setLoading] = useState(false)

  // Convert PDF page to image
  async function* convertPDFToImages(file: File) {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise
    const numPages = pdf.numPages

    // Báo cáo tiến trình 10% sau khi đọc được file PDF
    if (onProgress) onProgress(10)

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2 }) // Higher scale for better OCR
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue

      canvas.height = viewport.height
      canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      const imgData = canvas.toDataURL('image/png')

      // Update progress - phân bổ 10-40% cho việc render PDF
      const progress = 10 + (i / numPages) * 30
      if (onProgress) onProgress(progress)

      yield { image: imgData, pageNum: i }
    }
  }

  // Perform OCR on a single image
  async function performOCR(image: string): Promise<string> {
    const worker = await Tesseract.createWorker('vie')
    try {
      const {
        data: { text }
      } = await worker.recognize(image)
      return text
    } finally {
      await worker.terminate()
    }
  }

  // Process PDF file
  async function processPDF(file: File) {
    const imageIterator = convertPDFToImages(file)
    let extractedText = ''
    let pageCount = 0
    const totalPages = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise.then((pdf) => pdf.numPages)

    for await (const { image, pageNum } of imageIterator) {
      pageCount++
      const text = await performOCR(image)
      extractedText += `--- Trang ${pageNum} ---\n${text}\n`

      // Update progress - phân bổ 40-95% cho việc OCR
      const progress = 40 + (pageCount / totalPages) * 55
      if (onProgress) onProgress(Math.min(95, progress))
    }

    // Khi hoàn thành, đảm bảo tiến trình là 100%
    if (onProgress) onProgress(100)
    return extractedText
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeKB = file.size / 1024
    if (sizeKB > 2048) {
      console.log('❌ File quá lớn:', sizeKB, 'KB')

      // Changed from toast.success to toast.error for correct semantic meaning
      toast.error('File quá lớn! Vui lòng chọn file nhỏ hơn 2MB.')
      return
    }

    setLoading(true)
    if (onProcessingStart) onProcessingStart()
    if (onProgress) onProgress(0)

    try {
      if (file.type === 'application/pdf') {
        const text = await processPDF(file)
        onFileProcessed(text, file)
      } else if (file.type.startsWith('image/')) {
        if (onProgress) onProgress(10)
        const buffer = await file.arrayBuffer()
        if (onProgress) onProgress(30)
        const blob = new Blob([buffer], { type: file.type })
        const imageUrl = URL.createObjectURL(blob)
        if (onProgress) onProgress(50)
        const { data } = await Tesseract.recognize(imageUrl, 'vie', {
          logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
              onProgress(50 + m.progress * 45)
            }
          }
        })
        if (onProgress) onProgress(100)
        onFileProcessed(data.text, file)
        URL.revokeObjectURL(imageUrl)
      } else {
        onFileProcessed('Định dạng file không được hỗ trợ. Vui lòng tải lên PDF hoặc hình ảnh.', null)
      }
    } catch (err) {
      console.error('❌ Lỗi OCR:', err)
      toast.error('Không thể đọc được nội dung. Vui lòng thử lại.') // Added toast for OCR error
      onFileProcessed('Không thể đọc được nội dung.', null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <input
        type='file'
        accept='image/*,application/pdf'
        onChange={handleFileChange}
        className='text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
      />

      {loading && <span className='text-orange-500 text-sm'>Đang xử lý...</span>}
    </div>
  )
}

export default ContractUpload
