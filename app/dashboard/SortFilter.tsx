'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export default function SortFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort') || 'newest'

  function setSort(sort: 'newest' | 'oldest') {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`)
  }

  const baseClass =
    'px-4 py-2 rounded-lg border text-sm font-medium transition'
  const activeClass = 'bg-black text-white border-black'
  const inactiveClass = 'bg-white text-black border-gray-300 hover:bg-gray-100'

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => setSort('newest')}
        className={`${baseClass} ${currentSort === 'newest' ? activeClass : inactiveClass}`}
      >
        Najnovije
      </button>

      <button
        onClick={() => setSort('oldest')}
        className={`${baseClass} ${currentSort === 'oldest' ? activeClass : inactiveClass}`}
      >
        Najstarije
      </button>
    </div>
  )
}