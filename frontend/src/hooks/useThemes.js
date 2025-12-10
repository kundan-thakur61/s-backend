import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import adminAPI from '../api/adminAPI';

const DEFAULT_PAGE_SIZE = 18;

const safeExtractData = (response) => {
  if (!response) return [];
  const data = response.data?.data ?? response.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.themes)) return data.themes;
  return [];
};

export const useThemes = (itemsPerPage = DEFAULT_PAGE_SIZE) => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getThemes();
      setThemes(safeExtractData(response));
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to load themes';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const filteredThemes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return themes
      .filter((theme) => {
        if (!term) return true;
        const haystack = `${theme.name} ${theme.key}`.toLowerCase();
        return haystack.includes(term);
      })
      .filter((theme) => {
        if (filterActive === 'active') return theme.active;
        if (filterActive === 'inactive') return !theme.active;
        return true;
      });
  }, [themes, searchTerm, filterActive]);

  const totalCount = themes.length;
  const filteredCount = filteredThemes.length;
  const totalPages = filteredCount ? Math.ceil(filteredCount / itemsPerPage) : 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visibleThemes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredThemes.slice(start, start + itemsPerPage);
  }, [filteredThemes, currentPage, itemsPerPage]);

  const createTheme = useCallback(async (payload) => {
    try {
      const response = await adminAPI.createTheme(payload);
      const created = response.data?.data ?? response.data;
      if (created) {
        setThemes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        await fetchThemes();
      }
      toast.success('Theme created');
      return { success: true, data: created };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create theme';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    }
  }, [fetchThemes]);

  const updateTheme = useCallback(async (id, payload) => {
    try {
      const response = await adminAPI.updateTheme(id, payload);
      const updated = response.data?.data ?? response.data;
      if (updated) {
        setThemes((prev) => prev.map((theme) => (theme._id === id ? updated : theme)));
      }
      toast.success('Theme updated');
      return { success: true, data: updated };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update theme';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteTheme = useCallback(async (id) => {
    try {
      await adminAPI.deleteTheme(id);
      setThemes((prev) => prev.filter((theme) => theme._id !== id));
      toast.success('Theme deleted');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to delete theme';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const activateTheme = useCallback(async (id) => {
    try {
      const response = await adminAPI.activateTheme(id);
      const updated = response.data?.data ?? response.data;
      setThemes((prev) => prev.map((theme) => ({ ...theme, active: theme._id === id })));
      toast.success('Theme activated');
      return { success: true, data: updated };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to activate theme';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const isKeyUnique = useCallback((key, excludeId) => {
    if (!key) return true;
    const normalized = key.trim().toLowerCase();
    return !themes.some((theme) => theme.key?.toLowerCase() === normalized && theme._id !== excludeId);
  }, [themes]);

  return {
    themes: visibleThemes,
    allThemes: themes,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterActive,
    setFilterActive,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    filteredCount,
    totalCount,
    createTheme,
    updateTheme,
    deleteTheme,
    activateTheme,
    isKeyUnique,
    setError,
    refresh: fetchThemes,
  };
};

export default useThemes;
