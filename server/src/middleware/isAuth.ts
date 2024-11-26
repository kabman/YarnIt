import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("Not authenticated");
  }

  try {
    // You might want to add additional checks here, such as verifying the user's session
    // or checking if the user is still active in the database

    return next();
  } catch (error) {
    throw new Error("Authentication failed");
  }
};
