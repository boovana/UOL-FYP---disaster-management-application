import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const VideoPlayerScreen = ({ route }) => {
  const { videoId } = route.params;
  return (
    <WebView
      style={{ flex: 1 }}
      javaScriptEnabled
      domStorageEnabled
      source={{ uri: `https://www.youtube.com/embed/${videoId}?controls=1&autoplay=1` }}

    />
  );
};

export default VideoPlayerScreen;
