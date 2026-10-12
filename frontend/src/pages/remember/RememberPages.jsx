import { Navigate, Route, Routes } from 'react-router-dom'
import GuidePage from './GuidePage'
import RememberHub from './RememberHub'

export default function RememberPages() {
  return (
    <Routes>
      <Route index element={<RememberHub />} />
      <Route path=":slug" element={<GuidePage />} />
      <Route path="*" element={<Navigate to="/memorize" replace />} />
    </Routes>
  )
}
