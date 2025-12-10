import axiosClient from './axiosClient';

/**
 * Simple helper to detect a File/Blob
 * @param {any} f
 * @returns {boolean}
 */
const isFileLike = (f) => f && (f instanceof File || f instanceof Blob);

/**
 * Build FormData for file uploads.
 * files can be:
 * - a single File/Blob
 * - an array of File/Blob
 * - an object { fieldName: File | [File], ... } to support custom field names
 *
 * extraFields is an object of other key/value pairs to append.
 */
function buildFormData(files, extraFields = {}, defaultField = 'images') {
  const fd = new FormData();

  if (!files) {
    throw new Error('No files provided to buildFormData');
  }

  // If files is an object with fieldName keys, append accordingly
  if (typeof files === 'object' && !Array.isArray(files) && !isFileLike(files)) {
    Object.keys(files).forEach((field) => {
      const val = files[field];
      if (Array.isArray(val)) {
        val.forEach((f) => {
          if (!isFileLike(f)) throw new Error(`Invalid file in field ${field}`);
          fd.append(field, f);
        });
      } else {
        if (!isFileLike(val)) throw new Error(`Invalid file in field ${field}`);
        fd.append(field, val);
      }
    });
  } else {
    // files is a single file or array => use defaultField
    if (Array.isArray(files)) {
      if (files.length === 0) throw new Error('files array is empty');
      files.forEach((f) => {
        if (!isFileLike(f)) throw new Error('One of the items in files is not a File/Blob');
        fd.append(defaultField, f);
      });
    } else {
      if (!isFileLike(files)) throw new Error('Provided file is not a File/Blob');
      fd.append(defaultField, files);
    }
  }

  // append extra fields
  Object.keys(extraFields || {}).forEach((k) => {
    if (extraFields[k] !== undefined && extraFields[k] !== null) {
      fd.append(k, extraFields[k]);
    }
  });

  return fd;
}

/**
 * Standardized response wrapper
 * returns { success: boolean, data: any, status: number, error: any }
 */
async function handleRequest(promise) {
  try {
    const res = await promise;
    return { success: true, data: res.data, status: res.status, error: null };
  } catch (err) {
    // Normalize axios error shape
    const error = err?.response?.data || err?.message || err;
    const status = err?.response?.status || 0;
    return { success: false, data: null, status, error };
  }
}

/**
 * uploadAPI - enhanced client for uploads
 */
const uploadAPI = {
  /**
   * Upload multiple images.
   * @param {File|File[]|Object} files - File, array of Files, or object { fieldName: File|[File] }
   * @param {Object} options
   *  - onUploadProgress: function(progressEvent)
   *  - extraFields: object of extra form fields
   *  - timeout: ms (optional)
   *  - signal: AbortSignal (optional)
   * @returns {Promise<{success, data, status, error}>}
   */
  uploadImages: async (files, options = {}) => {
    const { onUploadProgress, extraFields = {}, timeout, signal } = options;
    const formData = buildFormData(files, extraFields, 'images');

    return handleRequest(
      axiosClient.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
        timeout,
        signal,
      })
    );
  },

  /**
   * Upload base64 image.
   * @param {Object} data - object containing base64 string and any metadata, e.g. { image: 'data:image/png;base64,...', name: 'foo.png' }
   */
  uploadBase64Image: async (data, options = {}) => {
    if (!data || !data.image) {
      return { success: false, data: null, status: 422, error: 'image (base64) is required' };
    }
    // optional timeout or signal
    const { timeout, signal } = options;
    return handleRequest(
      axiosClient.post('/uploads/base64', data, { timeout, signal })
    );
  },

  /**
   * Upload product variant image (Admin only)
   * @param {string} productId
   * @param {string} variantId
   * @param {File|File[]} files - single File or array (will use field 'image' for single file; if array, uses 'image')
   * @param {Object} options - { onUploadProgress, extraFields, timeout, signal }
   */
  uploadProductImage: async (productId, variantId, files, options = {}) => {
    if (!productId || !variantId) {
      return { success: false, data: null, status: 422, error: 'productId and variantId are required' };
    }
    const { onUploadProgress, extraFields = {}, timeout, signal } = options;
    // For variant we expect a single file under 'image' field; support arrays too
    const filesObject = {};
    filesObject.image = files;
    const formData = buildFormData(filesObject, extraFields);

    return handleRequest(
      axiosClient.post(`/uploads/product/${encodeURIComponent(productId)}/variant/${encodeURIComponent(variantId)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
        timeout,
        signal,
      })
    );
  },

  /**
   * Upload mockup template (Admin only)
   * @param {string} productId
   * @param {File|File[]} files - single File or array; field name used: 'mockup'
   * @param {Object} options - { onUploadProgress, extraFields, timeout, signal }
   */
  uploadMockupTemplate: async (productId, files, options = {}) => {
    if (!productId) {
      return { success: false, data: null, status: 422, error: 'productId is required' };
    }
    const { onUploadProgress, extraFields = {}, timeout, signal } = options;
    const filesObject = {};
    filesObject.mockup = files;
    const formData = buildFormData(filesObject, extraFields);

    return handleRequest(
      axiosClient.post(`/uploads/mockup/${encodeURIComponent(productId)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
        timeout,
        signal,
      })
    );
  },

  /**
   * Delete uploaded image
   * @param {string} publicId
   * @param {Object} options - { timeout, signal }
   */
  deleteImage: async (publicId, options = {}) => {
    if (!publicId) {
      return { success: false, data: null, status: 422, error: 'publicId is required' };
    }
    const { timeout, signal } = options;
    return handleRequest(
      axiosClient.delete(`/uploads/${encodeURIComponent(publicId)}`, { timeout, signal })
    );
  },

  /**
   * Convenience: returns an upload promise and a cancel function.
   * Example:
   *  const { promise, cancel } = uploadAPI.uploadWithCancel(files, options);
   *  // later...
   *  cancel(); // abort
   */
  uploadWithCancel: (files, options = {}) => {
    const controller = new AbortController();
    const promise = uploadAPI.uploadImages(files, { ...options, signal: controller.signal });
    return {
      promise,
      cancel: () => controller.abort(),
    };
  },
};

export default uploadAPI;
