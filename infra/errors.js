export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Internal Server Error", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Service Error", {
      cause,
    });
    this.name = "ServiceError";
    this.action = "Entre em contato com o suporte";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method Not Allowed");
    this.name = "MethodNotAllowedError";
    this.action = "Verifique se o método HTTP é válido para este endpoint";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Validation Error", {
      cause,
    });
    this.name = "ValidationError";
    this.action = action || "Verifique os dados e tente novamente";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Not Found", {
      cause,
    });
    this.name = "NotFoundError";
    this.action = action || "Verifique os dados e tente novamente";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Unauthorized", {
      cause,
    });
    this.name = "UnauthorizedError";
    this.action = action || "Verifique os dados e tente novamente";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ForbiddenError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Forbidden", {
      cause,
    });
    this.name = "ForbiddenError";
    this.action =
      action || "Verifique as feaatures necessárias e tente novamente";
    this.statusCode = 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
