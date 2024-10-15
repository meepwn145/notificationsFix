import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserContext from './UserContext';

function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      // Handling exception
      console.log(e);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('user');
        }
      } catch (e) {
        // Handling exception
        console.log(e);
      }
    };

    saveUser();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;