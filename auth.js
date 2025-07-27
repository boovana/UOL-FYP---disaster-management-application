
import { auth } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EmailAuthProvider,createUserWithEmailAndPassword,signInWithEmailAndPassword, signOut as firebaseSignOut,GoogleAuthProvider,signInWithCredential,sendPasswordResetEmail,sendEmailVerification, updateProfile} from 'firebase/auth';

// sign up with email and password
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
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


const actionCodeSettings = {
  // URL to redirect to after email link is clicked
  url: 'https://sturdy-layout-462317-b2.firebaseapp.com', // replace with your app URL or deep link
  handleCodeInApp: true,  
  android: { packageName: 'com.boovana.test', installApp: true, minimumVersion: '12' },
};

export const sendVerificationEmailToUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in.");

    await sendEmailVerification(user, actionCodeSettings);
    console.log("Verification email sent to:", user.email);
    const actionCodeSettings = {
      url: "https://www.google.com", // harmless neutral destination
      handleCodeInApp: false,
    };

    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, message: error.message };
  }
};
