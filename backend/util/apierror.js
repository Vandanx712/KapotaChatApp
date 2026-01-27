class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
      super(message);
      this.statusCode = statusCode;
      this.success = false;
      // this.errors = errors.length > 0 ? errors : [message];
        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        } 

    }
}

const handleError = (err, req, res, next) => {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: err.success,
        message: err.message,
        errors: err.errors
      });
    }
    // Fallback to general error
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  };


  
export {ApiError ,handleError}