import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import store from '../store';

const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

  const logout = () => signOut(auth);

  const getToken = () => auth.currentUser?.getIdToken();

  const watchAuthState = () => {
    onAuthStateChanged(auth, (user) => {
      store.commit('SET_USER', user);
    });
  };

  return { register, login, loginWithGoogle, logout, getToken, watchAuthState };
}
