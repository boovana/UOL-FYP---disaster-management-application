import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const VideoPlayerScreen = ({ route }) => {
  const { videoId } = route.params;
  return (
    <WebView
      style={{ flex: 1 }}
      javaScriptEnabled
      source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
    />
  );
};

export default VideoPlayerScreen;
