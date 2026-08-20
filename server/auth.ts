import { dummyUsers } from "./users";

export function authenticate(email: string, password: string) {
  const user = dummyUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
