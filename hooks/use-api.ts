/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react'
import axiosInstance from '../utils/axios'

interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  params?: Record<string, any>
}

export function useApi<T = any>(url: string, body?: any, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const callApi = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.request<ApiResponse<T>>({
        url,
        method: options.method || (body ? 'POST' : 'GET'),
        data: body,
        headers: options.headers,
        params: options.params,
      })

      setData(response.data.data)
      return response.data.data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url, body, options.method, options.headers, options.params])

  return { data, error, loading, callApi }
}
