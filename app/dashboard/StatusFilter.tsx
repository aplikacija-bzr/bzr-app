'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type StatusFilterProps = {
  counts: {
    all: number
    draft: number
    closed: number
  }
}

export default function StatusFilter({ counts }: StatusFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') || 'all'

  function setStatus(status: 'all' | 'draft' | 'closed') {
    const params = new URLSearchParams(searchParams.toString())

    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const baseClass =
    'px-4 py-2 rounded-lg border text-sm font-medium transition'
  const activeClass = 'bg-black text-white border-black'
  const inactiveClass = 'bg-white text-black border-gray-300 hover:bg-gray-100'

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => setStatus('all')}
        className={`${baseClass} ${currentStatus === 'all' ? activeClass : inactiveClass}`}
      >
        Sve ({counts.all})
      </button>

      <button
        onClick={() => setStatus('draft')}
        className={`${baseClass} ${currentStatus === 'draft' ? activeClass : inactiveClass}`}
      >
        Otvorene ({counts.draft})
      </button>

      <button
        onClick={() => setStatus('closed')}
        className={`${baseClass} ${currentStatus === 'closed' ? activeClass : inactiveClass}`}
      >
        Završene ({counts.closed})
      </button>
    </div>
  )
}