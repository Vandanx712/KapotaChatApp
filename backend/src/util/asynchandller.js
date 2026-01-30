export const asynchandller = (requestfuncton) => {
  return (req, res, next) => {
    Promise.resolve(requestfuncton(req, res, next)).catch((err) => next(err));
  };
};
