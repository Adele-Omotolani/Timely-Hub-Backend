import jwt from "jsonwebtoken";
import "dotenv/config";

interface Payload {
  id: string;
  role: string;
}
// const jwtSecret = ;
// if (!jwtSecret) {
//   throw new Error("JWT_SECRET environment variable is not defined");
// }

export const generateToken = (id: string, role: string): string => {
  const payload: Payload = { id, role };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};
