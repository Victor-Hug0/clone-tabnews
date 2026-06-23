import { InternalServerError, MethodNotAllowedError } from "infra/errors.js";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  console.error(publicErrorObject);
  response
    .status(publicErrorObject.statusCode)
    .json(publicErrorObject.toJSON());
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: error.statusCode
  });
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject.toJSON());
}

const controller = {
    errorHandlers: {
        onErrorHandler,
        onNoMatchHandler,
    }
};

export default controller;