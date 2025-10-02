"use client";

import { type User } from "@workspace/server/drizzle/schema";
import { ReactNode, createContext, useContext } from "react";

interface Props {
  children: ReactNode;
  user: User;
}

const UserContext = createContext<User | undefined>(undefined);

export const UserProvider = ({ children, user }: Props) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
