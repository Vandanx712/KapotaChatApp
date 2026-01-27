export const asynchandller = (requestfunction) => {
  return (req, res, next) => {
    Promise.resolve(requestfunction(req, res, next)).catch((err) => next(err));
  };
};
