/**
 * API utility functions for making HTTP requests.
 * Provides helper functions for GET, POST, PATCH, PUT, and DELETE requests.
 * 
 * @module api
 */

/**
 * Makes an HTTP request with default options including credentials and JSON headers.
 * 
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Request options (method, body, headers, etc.)
 * @returns {Promise<Object>} The JSON response data
 * @throws {Error} If the request fails or returns a non-OK status
 */
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

/**
 * Makes a GET request with query parameters.
 * 
 * @param {string} url - The URL to make the request to
 * @param {Object} params - Query parameters to append to the URL
 * @returns {Promise<Object>} The JSON response data
 */
export async function apiGet(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  return apiRequest(fullUrl, {
    method: 'GET',
  });
}

/**
 * Makes a POST request with a JSON body.
 * 
 * @param {string} url - The URL to make the request to
 * @param {Object} body - The request body to send as JSON
 * @returns {Promise<Object>} The JSON response data
 */
export async function apiPost(url, body = {}) {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Makes a PATCH request with a JSON body.
 * 
 * @param {string} url - The URL to make the request to
 * @param {Object} body - The request body to send as JSON
 * @returns {Promise<Object>} The JSON response data
 */
export async function apiPatch(url, body = {}) {
  return apiRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Makes a PUT request with a JSON body.
 * 
 * @param {string} url - The URL to make the request to
 * @param {Object} body - The request body to send as JSON
 * @returns {Promise<Object>} The JSON response data
 */
export async function apiPut(url, body = {}) {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Makes a DELETE request.
 * 
 * @param {string} url - The URL to make the request to
 * @returns {Promise<Object>} The JSON response data
 */
export async function apiDelete(url) {
  return apiRequest(url, {
    method: 'DELETE',
  });
}

/**
 * Extracts a user-friendly error message from an error object.
 * 
 * @param {Error|Object} error - The error object
 * @returns {string} A user-friendly error message
 */
export function getErrorMessage(error) {
  if (error.message) {
    return error.message;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
