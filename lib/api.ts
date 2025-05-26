// Função simples para fazer requisições HTTP
export const api = {
  async get(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    })
    return response
  },

  async post(url: string, data?: any, options?: RequestInit) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    return response
  },

  async put(url: string, data?: any, options?: RequestInit) {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    return response
  },

  async delete(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    })
    return response
  },
}
