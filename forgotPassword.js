import React, { useState, useEffect, useCallback } from "react";
import {Text,View,SafeViewArea, StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import {forgotPassword} from './auth'


const ResetPassword =()=>{

    const [email, setEmail] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleReset = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        const result = await forgotPassword(email);
        console.log(result)
        if (!result.success) {
            setErrorMsg(result.message);
        } 
        else {
            setSuccessMsg("Password reset link sent! Check your email/spam");
        }
    };
    return(
        <View style={{backgroundColor:'white', height:'100%', flex:1,justifyContent:'center' }}>
            <Text style={styles.header}>Reset your password</Text>
            <View style={styles.textInputContainer}>
                <TextInput style={styles.textInputStyle} placeholderTextColor='#ACACAC' placeholder='Email' onChangeText={setEmail} />
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            <View>
                <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                    <Text style={{color:'black', fontFamily:'times new roman', fontSize:16}}>Send link</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    textInputContainer:{
        padding:10,
        borderRadius:15,
    },
    textInputStyle:{
        fontFamily:'times new roman',
        backgroundColor:'#F5F5F5',
        padding:15,
        borderRadius:15,
        color:'#54626F',
        borderColor: '#ccc',
        borderWidth: 1,
    },
    header:{
        fontFamily:'times new roman',
        fontSize:20,
        color:'#54626F',
        textAlign:'center',
        marginTop:20,
        padding:10,
        fontWeight:'bold'
    },
    resetBtn:{
        backgroundColor:'#9DC183',
        width:'25%',
        height:40,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:10,
        alignSelf:'flex-end',
        margin:10
    },
    errorText:{
        color:'red',
        fontFamily:'times new roman',
        fontStyle:'italic',
        fontSize:13,
        padding:15,
        textAlign:'center'
    },
    successText:{
        color:'green',
        fontFamily:'times new roman',
        fontStyle:'italic',
        fontSize:13,
        padding:15,
        textAlign:'center'
    }
})

export default ResetPassword