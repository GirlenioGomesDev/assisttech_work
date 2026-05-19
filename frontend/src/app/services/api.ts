// Cliente HTTP usado pelas telas para falar com o backend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Token salvo no login vai junto nas rotas protegidas.
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Sessao invalida volta para o login.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }

    throw new Error(data.erro || data.mensagem || 'Erro na requisicao');
  }

  return data;
}
