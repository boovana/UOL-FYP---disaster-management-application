import React, { useState, useEffect } from "react";
import {Text,View,SafeViewArea, StyleSheet, TextInput, TouchableOpacity, Modal} from 'react-native';
import app from "./firebaseConfig";
import { signUp, googleSignIn, sendVerificationEmailToUser} from "./auth";
import {useNavigation } from '@react-navigation/native';



const SignUp = ({navigation}) =>{
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [modalVisible, setModalVisible] = useState(false);

    const [error, setError] = useState("");


    const handleSignUp = async () => 
    {
        if(password != confirmPassword){
            setError("Passwords do not match");
            return;
        }

        {
            try 
            {
                // mock email for testing and eval
                // if(email =='test@gmail.com'){
                //     console.log("mock signup for test email");
                //     setModalVisible(true);
                //     setError(""); 
                //     navigation.navigate("login");
                //     return;              
                // }
                await signUp(email, password, displayName);
                console.log("Signup using valid email and strong password -- successful!: ", email);
                await sendVerificationEmailToUser()
                //show modal when sign up is successful
                setModalVisible(true)
                // clear the error
                setError("");
                // nav to the main login screen after successful signup
                navigation.navigate("login");
            } 
            catch (error) 
            {
                console.error("Signup Error:", error);
                // if email already registered 
                if (error.code === "auth/email-already-in-use") {
                    setError("Email already in use");
                } 
                // if invalid email format
                else if (error.code === "auth/invalid-email") {
                    setError("Invalid email");
                } 
                // if weak password
                else if (error.code === "auth/weak-password") {
                    setError("Password should be at least 8 characters with at least 1 uppercase character, 1 lowercase character, 1 special character and 1 numeric character");
                } 
                else {
                    setError(error.message);
                }
            }
        };
    }
    
    // const googleSignIn = async () => {
    //     console.log("Pressed sign in");

    //     try {
    //         await GoogleSignin.hasPlayServices();
    //         const userInfo = await GoogleSignin.signIn();
    //         console.log("Google Sign-In Successful:", userInfo);

    //         // Create a Google credential with the token
    //         const googleCredential = auth.GoogleAuthProvider.credential(
    //             userInfo.idToken
    //         );

    //         // Sign-in the user with the credential
    //         await auth().signInWithCredential(googleCredential);
    //     } 
    //     catch (error) {
    //         console.error("Google Sign-In Error:", error);
    //         setError(error.message);
    //     }
    // };


    return(
        <View style={{flex:1,justifyContent:'center',backgroundColor:'white', padding:15, }}>
            <Text style={styles.header}>Let's get started!</Text>
            <View style={styles.signUpFormContainer}>
                <TextInput style={styles.input} placeholderTextColor='#ACACAC' placeholder='Username' value={displayName} onChangeText={setDisplayName}/>
            </View>
            <View style={styles.signUpFormContainer}>
                <TextInput style={styles.input} placeholderTextColor='#ACACAC' placeholder='Enter your email' value={email} onChangeText={setEmail} keyboardType="email-address"/>
            </View>
            <View style={styles.signUpFormContainer}>
                <TextInput  style={styles.input}  placeholderTextColor='#ACACAC' placeholder='Password' secureTextEntry ={true} onChangeText={setPassword} value={password}/>
            </View>
            <View style={styles.signUpFormContainer}>
                <TextInput  style={styles.input}  placeholderTextColor='#ACACAC' placeholder='Re-enter password' secureTextEntry={true} value={confirmPassword} onChangeText={setConfirmPassword}/>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                <Text style={styles.signUpButtonText}>Sign up</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Signup Successful!</Text>
                        {/* <TouchableOpacity style={styles.modalButton}  onPress={() => navigation.navigate('login')}>
                        </TouchableOpacity> */}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    signUpFormContainer:{
        width: '100%',
        backgroundColor:"white",
        padding:20,
        alignItems:'center'
    },
    header:{
        fontFamily:'times new roman',
        fontSize:30,
        fontWeight:'bold',
        color:'#54626F',
        textAlign:'center'
    },
    signUpButton: {
        backgroundColor: "#007bff",
        padding: 12,
        borderRadius: 8,
        alignSelf:'flex-end',
        alignItems: 'center',
        width:'40%',
        marginHorizontal:20
    },
    signUpButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontFamily:'times new roman'
    },
    errorText: {
        color: "red",
        marginBottom: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 10,
        alignItems: "center",
        width: "80%",
    },
    modalText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: "#007bff",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    modalButtonText: {
        color: "#fff",
        fontSize: 16,
    },
    input:{
        backgroundColor: '#F5F5F5',
        fontFamily:'times new roman',
        color:'#54626F',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: '#ccc',
        width:'100%',
        padding:10,
        height:50,
    }
})

export default SignUp