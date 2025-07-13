import React from 'react'
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";


const Footer =({navigation}) =>{
    return (
        <View style={styles.footer}>
            {/** home icon */}
            <TouchableOpacity onPress={()=>navigation.navigate('home')}>
                <Image style={styles.footerButtonIcon} source={require('./assets/images/Home.png')}/>
                <Text style={styles.footerText}>Home</Text>
            </TouchableOpacity>

            {/** alerts icon */}
            <TouchableOpacity onPress={()=>navigation.navigate('weatherForecast')}>
                <Image style={styles.footerButtonIcon} source={require('./assets/images/alerts.png')}/>
                <Text style={styles.footerText}>Alerts</Text>
            </TouchableOpacity>

            {/** tasks icon */}
            <TouchableOpacity onPress={()=>navigation.navigate('disasterPrepTasks')}>
                <Image style={styles.footerButtonIcon} source={require('./assets/images/book.png')}/>
                <Text style={styles.footerText}>Prepare</Text>
            </TouchableOpacity>

            {/** resources icon */}
            <TouchableOpacity onPress={()=>navigation.navigate('resources')}>
                <Image style={styles.footerButtonIcon} source={require('./assets/images/soss.png')}/>
                <Text style={styles.footerText}>Resources</Text>
            </TouchableOpacity>

             {/** settings icon */}
            <TouchableOpacity onPress={()=>navigation.navigate('Settings')}>
                <Image style={styles.footerButtonIcon} source={require('./assets/images/settings.png')}/>
                <Text style={styles.footerText}>Settings</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles =StyleSheet.create({
    footer: {
        position: "absolute",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        padding: 6,
        backgroundColor: 'white',
        left: 0,
        right: 0,
        bottom: 0,
    },
    footerButton: {
        alignItems: "center",
    },
    footerButtonIcon: {
        width: 28,
        height: 28,
        marginBottom: 5,
        alignSelf:'center'
    },
    footerText: {
        fontSize: 12,
        color: 'black',
    },
})

export default Footer