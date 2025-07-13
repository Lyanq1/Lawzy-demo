import ChatBot from '../components/ChatBot'
import { Toaster } from 'sonner'

const Home = () => {
  return (
    <>
      <Toaster position='top-center' richColors closeButton /> {/* ✅ Must be inside JSX */}
      <main className='min-h-screen bg-gray-900 text-white'>
        <ChatBot />
      </main>
    </>
  )
}

export default Home
