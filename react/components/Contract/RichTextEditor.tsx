// components/RichTextEditor.tsx
import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'

import { Trash2, CheckCircle2, Undo2 } from 'lucide-react'

type Note = {
  id: string
  content: string
  done: boolean
}

const LOCAL_KEY = 'rich_text_notes'

const RichTextEditor = () => {
  const [notes, setNotes] = useState<Note[]>([])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ListItem,
      BulletList,
      OrderedList
    ],
    content: '<p>Ghi chú ở đây...</p>'
  })

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) {
      setNotes(JSON.parse(stored))
    }
  }, [])

  const saveNotesToStorage = (newNotes: Note[]) => {
    setNotes(newNotes)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newNotes))
  }

  const handleSave = () => {
    if (!editor) return
    const html = editor.getHTML()
    if (!html || html === '<p></p>') return
    const newNote: Note = {
      id: Date.now().toString(),
      content: html,
      done: false
    }
    const updated = [newNote, ...notes]
    saveNotesToStorage(updated)
    editor.commands.setContent('<p>Ghi chú ở đây...</p>')
  }

  const handleToggleDone = (id: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n))
    saveNotesToStorage(updated)
  }

  const handleDelete = (id: string) => {
    const updated = notes.filter((n) => n.id !== id)
    saveNotesToStorage(updated)
  }

  return (
    <div className='space-y-6'>
      {/* Toolbar */}
      <div className='flex flex-wrap gap-2 border-b pb-3 items-center'>
        <button onClick={() => editor?.chain().focus().toggleBold().run()} className='btn font-bold cursor-pointer'>
          B
        </button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()} className='btn italic cursor-pointer'>
          I
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className='btn underline cursor-pointer'
        >
          U
        </button>
        <input
          type='color'
          onInput={(e) => editor?.chain().focus().setColor(e.currentTarget.value).run()}
          className='w-6 h-6 border rounded cursor-pointer'
        />
        {/* <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`btn ${editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''}`}
        >
          •
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`btn ${editor?.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : ''}`}
        >
          1.
        </button> */}

        <button onClick={() => editor?.chain().focus().setTextAlign('left').run()} className='btn cursor-pointer'>
          Trái
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign('center').run()} className='btn cursor-pointer'>
          Giữa
        </button>
        <button onClick={() => editor?.chain().focus().setTextAlign('right').run()} className='btn cursor-pointer'>
          Phải
        </button>
        <button onClick={handleSave} className='ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded'>
          + Lưu
        </button>
      </div>

      {/* Editor */}
      <div className='border rounded p-4 min-h-[200px] bg-white shadow-sm'>
        <EditorContent editor={editor} />
      </div>

      {/* Notes */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold'>Ghi chú của bạn</h2>
        {notes
          .filter((n) => !n.done)
          .map((note) => (
            <div key={note.id} className='border p-3 rounded relative group bg-white shadow-sm'>
              <div dangerouslySetInnerHTML={{ __html: note.content }} />
              <div className='absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition'>
                <button onClick={() => handleToggleDone(note.id)} title='Đánh dấu xong'>
                  <CheckCircle2 className='text-green-600 hover:scale-110 transition' />
                </button>
                <button onClick={() => handleDelete(note.id)} title='Xoá'>
                  <Trash2 className='text-red-500 hover:scale-110 transition' />
                </button>
              </div>
            </div>
          ))}
        {/* Completed Section */}
        {notes.some((n) => n.done) && (
          <div className='mt-8'>
            <h3 className='text-lg font-semibold'>Đã hoàn thành</h3>
            <div className='space-y-2 mt-2'>
              {notes
                .filter((n) => n.done)
                .map((note) => (
                  <div key={note.id} className='border p-3 rounded relative group bg-gray-50 shadow-sm'>
                    <div dangerouslySetInnerHTML={{ __html: note.content }} />

                    <div className='absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition'>
                      <button onClick={() => handleToggleDone(note.id)} title='Hoàn tác'>
                        <Undo2 className='text-gray-600 hover:scale-110 transition' />
                      </button>
                      <button onClick={() => handleDelete(note.id)} title='Xoá'>
                        <Trash2 className='text-red-500 hover:scale-110 transition' />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Tailwind helper styles */}
      <style>{`
        .btn {
          @apply px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 transition text-sm;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
