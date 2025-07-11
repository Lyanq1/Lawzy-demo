// ChatBot.tsx
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ChatSidebar from './ChatSidebar'
import ChatHeader from './ChatHeader'
import ChatInterface from './ChatInterface'
import BotTypingMessage from './BotTypingMessage'
import DiagramSection from './DiagramSection'
import LawyerPopup from './LawyerPopup'
import { markdownToHTML } from '../utils/markdownUtils'
import type { Message, ChatHistory, DiagramData } from '../types'
import { extractDiagramJson } from '../utils/parseUtils'
import ContractAssistant from './Contract/ContractAssistant'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

const ChatBot = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLawyers, setShowLawyers] = useState<boolean>(false)
  const [diagram, setDiagram] = useState<DiagramData | null>(null)
  const [activeTab, setActiveTab] = useState<'diagram' | 'image' | 'video'>('diagram')
  const [showContract, setShowContract] = useState(false)

  //
  const extractedText = useSelector((state: RootState) => state.extracted.text)

  // Tin nhắn chào mừng ban đầu
  const welcomeMessage: Message = {
    from: 'bot',
    text: '# Chào mừng bạn đến với Lawzy!\nTôi là trợ lý AI pháp lý, có thể giúp bạn:\n- Giải đáp thắc mắc về luật pháp\n- Hướng dẫn thủ tục pháp lý\n- Phân tích tài liệu pháp lý\n- Kết nối với luật sư chuyên nghiệp\n\nBạn cần hỗ trợ gì hôm nay?',
    timestamp: new Date()
  }

  useEffect(() => {
    let storedId = localStorage.getItem('sessionId')
    if (!storedId) {
      storedId = uuidv4()
      localStorage.setItem('sessionId', storedId)
    }
    setSessionId(storedId)

    const mockHistories: ChatHistory[] = [
      // { id: 'hist1', title: 'Tư vấn hợp đồng thuê nhà', date: new Date(2025, 15 - 1, 6) }, // 15/06/2025
      // { id: 'hist2', title: 'Tranh chấp đất đai', date: new Date(2025, 22 - 1, 7) }, // 22/07/2025
      // { id: 'hist3', title: 'Thủ tục ly hôn', date: new Date(2025, 3 - 1, 8) } // 03/08/2025
    ]
    setChatHistories(mockHistories)

    setMessages([welcomeMessage])
  }, [])

  // Hàm để bắt đầu một cuộc trò chuyện mới
  const startNewChat = () => {
    setMessages([{ ...welcomeMessage, timestamp: new Date() }])
    setDiagram(null)
    setActiveChatId(null)
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      from: 'user',
      text: input,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    // ("https://lawzy-backend.onrender.com/api/chatbot"
    try {
      const res = await fetch('https://lawzy-backend.onrender.com/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId, context: extractedText })
      })

      const data = await res.json()
      let rawOutput = data.output

      if (typeof rawOutput !== 'string') {
        rawOutput = JSON.stringify(rawOutput)
      }

      const { text: cleanText, diagram } = extractDiagramJson(rawOutput)

      console.log('✅ Bot trả về text:', cleanText)
      console.log('📊 Parsed diagram:', diagram)

      setMessages((prev) => [...prev, { from: 'bot', text: cleanText, timestamp: new Date() }])
      setDiagram(diagram)

      if (messages.length <= 1) {
        const newChatId = uuidv4()
        const newChat: ChatHistory = {
          id: newChatId,
          title: input.slice(0, 30) + '...',
          date: new Date()
        }
        setChatHistories((prev) => [newChat, ...prev])
        setActiveChatId(newChatId)
      }
    } catch (err) {
      console.error('❌ Lỗi khi gửi hoặc xử lý phản hồi chatbot:', err)
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: '⚠️ Đã xảy ra lỗi khi gửi tin nhắn.', timestamp: new Date() }
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })

  return (
    <div className='flex flex-col h-screen bg-white text-gray-800 overflow-hidden font-["Inter"]'>
      <div className='flex flex-1 h-full overflow-hidden'>
        {/* Sidebar lịch sử chat */}
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          chatHistories={chatHistories}
          activeChatId={activeChatId}
          startNewChat={startNewChat}
          setActiveChatId={setActiveChatId}
          className='h-full'
          formatDate={formatDate}
        />

        {/* Khung chat chính */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          <ChatHeader
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sessionId={sessionId}
            showLawyers={showLawyers}
            toggleLawyersPanel={() => setShowLawyers(!showLawyers)}
            toggleContractPanel={() => setShowContract(true)}
          />

          <div className='flex flex-1 overflow-hidden'>
            <ChatInterface
              messages={messages}
              loading={loading}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              markdownToHTML={markdownToHTML}
              formatTime={formatTime}
              BotTypingMessage={BotTypingMessage}
            />

            {/* Panel bên phải: có tab điều hướng */}
            <div className='w-[400px] bg-[#fefff9] border-l border-gray-200 flex flex-col'>
              {/* Tabs */}
              <div className='p-2 border-b border-gray-200 flex items-center justify-around gap-3'>
                {['diagram', 'image', 'video'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as 'diagram' | 'image' | 'video')}
                    className={`px-6 py-2 rounded-full min-w-[100px] transition-colors ${
                      activeTab === tab ? 'bg-[#fc8e5a] text-white font-semibold' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab === 'diagram' && 'Sơ đồ'}
                    {tab === 'image' && 'Hình ảnh'}
                    {tab === 'video' && 'Video'}
                  </button>
                ))}
              </div>

              {/* Nội dung tab */}
              <div className='flex-1 overflow-auto p-2'>
                {activeTab === 'diagram' &&
                  (diagram ? (
                    <DiagramSection diagramData={diagram} key={JSON.stringify(diagram)} />
                  ) : (
                    <div className='text-gray-500 text-center mt-10'>Chưa có biểu đồ nào được vẽ.</div>
                  ))}

                {activeTab === 'image' && (
                  <div className='text-gray-500 text-center mt-10'>Tính năng hình ảnh sẽ sớm ra mắt.</div>
                )}

                {activeTab === 'video' && (
                  <div className='text-gray-500 text-center mt-10'>Tính năng video sẽ sớm ra mắt.</div>
                )}
              </div>
            </div>

            {/* Popup kết nối luật sư */}
            <LawyerPopup isOpen={showLawyers} onClose={() => setShowLawyers(false)} />

            {/* Trợ lý hợp đồng */}
            <ContractAssistant isOpen={showContract} onClose={() => setShowContract(false)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBot
