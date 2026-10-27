import { Navigate, Route, Routes } from 'react-router-dom'
import BlogIndex from './BlogIndex'
import BlogPost from './BlogPost'

export default function BlogPages() {
  return (
    <Routes>
      <Route index element={<BlogIndex />} />
      <Route path=":slug" element={<BlogPost />} />
      <Route path="*" element={<Navigate to="/blog" replace />} />
    </Routes>
  )
}
