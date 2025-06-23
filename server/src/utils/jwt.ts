import jwt from "jsonwebtoken";

export const generateToken = (id: number, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
};
