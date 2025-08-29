import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  const saltRounds = 10; // standard
  return await bcrypt.hash(password, saltRounds);
}
