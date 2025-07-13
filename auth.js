
import { auth } from './firebaseConfig';

import {createUserWithEmailAndPassword,signInWithEmailAndPassword, signOut as firebaseSignOut,GoogleAuthProvider,signInWithCredential,sendPasswordResetEmail } from 'firebase/auth';

// sign up with email and password
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } 
  catch (error) {
    throw error;
  }
};

// sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } 
  catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email)=>{
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } 
  catch (error) {
    let message = '';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      default:
        message = 'Something went wrong. Please try again.';
    }
    return { success: false, message: message };
  }
}

// sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } 
  catch (error) {
    throw error;
  }
};

// retreive current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
