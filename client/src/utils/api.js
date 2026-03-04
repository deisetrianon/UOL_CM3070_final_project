export async function apiRequest(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[apiRequest] Error calling ${url}:`, error);
    throw error;
  }
}

export async function apiGet(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  return apiRequest(fullUrl, {
    method: 'GET',
  });
}

export async function apiPost(url, body = {}) {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPatch(url, body = {}) {
  return apiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiPut(url, body = {}) {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete(url) {
  return apiRequest(url, {
    method: 'DELETE',
  });
}

export function getErrorMessage(error) {
  if (error.message) {
    return error.message;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
