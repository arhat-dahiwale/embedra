import {
  Domain,
  CreateIdeaInput,
  UpdateIdeaInput,
  IdeaResponse,
  LoginInput,
  SignupInput,
  AuthResponse,
  UserResponse,
} from "@embedra/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data.details);
  }

  return data as T;
}

// ---------- DOMAIN LOOKUP ----------
export async function getDomains(): Promise<Domain[]> {
  return request<Domain[]>("/domains");
}

// ---------- IDEA CRUD ----------
export async function getIdea(id: string, token?: string): Promise<IdeaResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return request<IdeaResponse>(`/ideas/${id}`, {
    method: "GET",
    headers,
  });
}

export async function createIdea(
  input: CreateIdeaInput,
  token: string
): Promise<{ idea: IdeaResponse; group: any }> {
  return request<{ idea: IdeaResponse; group: any }>("/ideas", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export async function updateIdea(
  id: string,
  input: UpdateIdeaInput,
  token: string
): Promise<IdeaResponse> {
  return request<IdeaResponse>(`/ideas/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export async function deleteIdea(id: string, token: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/ideas/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ---------- AUTH ----------
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function signupUser(input: SignupInput): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMe(token: string): Promise<{ user: UserResponse }> {
  return request<{ user: UserResponse }>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { ApiError };
