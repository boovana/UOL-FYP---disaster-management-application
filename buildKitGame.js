import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NativeModules } from 'react-native';

const BuildKitGame= () => {
  useEffect(() => {
    console.log('ExpoScreenOrientation native module:', NativeModules.ExpoScreenOrientation);

    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://www.ready.gov/kids/games/data/bak-english/index.html' }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
      />
    </View>
  );
};

export default BuildKitGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
