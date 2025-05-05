import { useState, useEffect } from 'react'
import axiosInstance from '@/utils/axios'

// const useApi = <T = any>(url: string, options = {}) => {

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useApi<T = any>(url: string, options = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    console.log('🚀🚀🚀🚀 FETCH TASK')
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(url, options)
        setData(response.data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [url, options])

  return { data, loading, error }
}
export default useApi
