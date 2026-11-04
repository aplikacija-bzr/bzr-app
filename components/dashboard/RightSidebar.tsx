import type { CSSProperties } from 'react'

export default function RightSidebar() {
  return <aside style={sidebar}></aside>
}

const sidebar: CSSProperties = {
  width: 320,
}