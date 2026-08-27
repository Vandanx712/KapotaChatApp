class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors.length > 0 ? errors : [message];

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleError = (err, req, res, next) => {
  console.error("API Error:", err?.response?.data || err?.message || err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err?.isAxiosError) {
    const status = err.response?.status || 500;
    const errorMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "External API error";
    return res.status(status).json({
      success: false,
      message: `Location Service Error: ${errorMsg}`,
      errors: [errorMsg],
    });
  }

  // Fallback to general error
  return res.status(500).json({
    success: false,
    message: err?.message || "Internal server error",
  });
};

export { ApiError, handleError };
