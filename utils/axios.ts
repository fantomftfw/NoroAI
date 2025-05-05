import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    }
    // You can add more default config here (e.g., timeout, withCredentials)
});


axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');

        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            try {
                const { data } = await axiosInstance.post('/auth/refresh-token', { token: refreshToken });
                localStorage.setItem('accessToken', data.accessToken);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.log('🚀 ~ axiosInstance.interceptors.response.use ~ refreshError:', refreshError)
                // Handle token refresh error (e.g., redirect to login)
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 