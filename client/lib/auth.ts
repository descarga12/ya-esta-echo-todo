export interface User {
  username: string;
  password: string; // stored in plain text for demo only
  role?: "admin" | "user" | "registrar";
  name?: string;
  unidadOrganica?: string;
  cargo?: string;
}

const USERS_KEY = "qr-inventory.users.v1";
const SESSION_KEY = "qr-inventory.session.v1";

function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureDefaultAdmin() {
  const users = readUsers();
  if (!users.find((u) => u.username === "admin")) {
    users.unshift({
      username: "admin",
      password: "123456",
      role: "admin",
      name: "Administrador",
    });
    writeUsers(users);
  }
}

export function createUser(user: User) {
  const users = readUsers();
  if (users.find((u) => u.username === user.username)) {
    throw new Error("Usuario ya existe");
  }
  users.push(user);
  writeUsers(users);
  return user;
}

export function listUsers() {
  return readUsers();
}

export function login(username: string, password: string) {
  const users = readUsers();
  const u = users.find(
    (x) => x.username === username && x.password === password,
  );
  if (!u) throw new Error("Credenciales inválidas");
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: u.username }));
  return u;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function currentUser(): User | null {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (!s) return null;
    const { username } = JSON.parse(s);
    const users = readUsers();
    return users.find((u) => u.username === username) || null;
  } catch {
    return null;
  }
}

export function isAdmin() {
  const u = currentUser();
  return !!u && u.role === "admin";
}
