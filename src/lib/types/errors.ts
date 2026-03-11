// ---- Repository-layer errors (local SQLite / storage) ----

export interface DbError {
  type: "db";
  message: string;
  cause?: unknown;
}

export interface NotFoundError {
  type: "not_found";
  message: string;
}

export interface ConstraintError {
  type: "constraint";
  message: string;
}

export interface UnknownRepoError {
  type: "unknown";
  message: string;
  cause?: unknown;
}

export type RepoError = DbError | NotFoundError | ConstraintError | UnknownRepoError;

// ---- API / network-layer errors ----

export interface NetworkError {
  type: "network";
  message: string;
  cause?: unknown;
}

export interface HttpError {
  type: "http";
  status: number;
  message: string;
}

export interface UnauthorizedError {
  type: "unauthorized";
  message: string;
}

export interface UnknownApiError {
  type: "unknown";
  message: string;
  cause?: unknown;
}

export type ApiError = NetworkError | HttpError | UnauthorizedError | UnknownApiError;
