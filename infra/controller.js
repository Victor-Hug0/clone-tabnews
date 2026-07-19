import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors.js";
import * as cookie from "cookie";
import session from "models/session.js";
import user from "models/user.js";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(response, sessionToken) {
  const sessionCookie = cookie.serialize("session_id", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    path: "/",
    sameSite: "Strict",
  });

  response.setHeader("Set-Cookie", sessionCookie);
}

async function clearSessionCookie(response) {
  const sessionCookie = cookie.serialize("session_id", "invalid", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1,
    path: "/",
    sameSite: "Strict",
  });

  response.setHeader("Set-Cookie", sessionCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);

    return next();
  }

  injectAnonymousUser(request);

  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.getValidByToken(sessionToken);
  const userObject = await user.getById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    if (!request.context.user.features.includes(feature)) {
      throw new ForbiddenError({
        message: "Você não tem permissão para executar esta ação.",
        action: `Verifique se você tem a feature "${feature}" e tente novamente.`,
      });
    }
    return next();
  };
}
const controller = {
  errorHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
