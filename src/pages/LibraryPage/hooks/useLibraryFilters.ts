import { useState } from 'react'
import type { Book } from '../types'

/**
 * Estado de filtros/ordenacao da Biblioteca e a lista derivada `filtered`.
 * Ordem de aplicacao preservada: status -> favoritos -> ano -> ordenacao.
 */
export function useLibraryFilters(allBooks: Book[]) {
  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState<string>('all')
  const [filterYear,      setFilterYear]      = useState<string>('all')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [sortBy,          setSortBy]          = useState<string>('created_at')

  /* Compute years from data */
  const years = [...new Set(
    allBooks
      .map((b) => b.finished_at ?? b.started_at ?? b.created_at)
      .filter(Boolean)
      .map((d) => new Date(d!).getFullYear())
  )].sort((a, b) => b - a)

  /* Apply filters */
  let filtered = allBooks
  const q = search.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter((b) =>
      b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q),
    )
  }
  if (filterStatus !== 'all')   filtered = filtered.filter((b) => b.status === filterStatus)
  if (filterFavorites)          filtered = filtered.filter((b) => b.favorite)
  if (filterYear !== 'all') {
    const yr = parseInt(filterYear)
    filtered = filtered.filter((b) => {
      const d = b.finished_at ?? b.started_at ?? b.created_at
      return d ? new Date(d).getFullYear() === yr : false
    })
  }

  /* Sort */
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'title')        return (a.title ?? '').localeCompare(b.title ?? '')
    if (sortBy === 'rating')       return (b.rating ?? 0) - (a.rating ?? 0)
    if (sortBy === 'finished_at')  return (b.finished_at ?? '').localeCompare(a.finished_at ?? '')
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  /* Group by section (only if no status filter active) */
  const useGroups = filterStatus === 'all'

  return {
    search, setSearch,
    filterStatus, setFilterStatus,
    filterYear, setFilterYear,
    filterFavorites, setFilterFavorites,
    sortBy, setSortBy,
    years,
    filtered,
    useGroups,
  }
}
