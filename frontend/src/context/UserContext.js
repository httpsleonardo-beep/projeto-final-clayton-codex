'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState(() => {
    if (typeof window === 'undefined') return null;

    try {
      const storedUser = window.localStorage.getItem('fleetguard:selectedUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (selectedUser) {
      window.localStorage.setItem('fleetguard:selectedUser', JSON.stringify(selectedUser));
    } else {
      window.localStorage.removeItem('fleetguard:selectedUser');
    }
  }, [selectedUser]);

  return (
    <UserContext.Provider value={{ selectedUser, setSelectedUser, users, setUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}

export default UserContext;
