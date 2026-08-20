import type {
  CSSProperties,
  ReactNode,
} from 'react'

import { theme } from '@/components/ui/theme'

type PageContainerProps = {
  children: ReactNode
}

export default function PageContainer({
  children,
}: PageContainerProps) {
  return (
    <main style={container}>
      {children}
    </main>
  )
}

const container: CSSProperties = {
  width: '100%',
  maxWidth: theme.layout.pageMaxWidth,
  margin: '0 auto',
  padding: theme.layout.pagePadding,
  boxSizing: 'border-box',
}