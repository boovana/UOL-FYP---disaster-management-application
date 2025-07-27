import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const PDFViewer = ({ route }) => {
  const { url } = route.params;
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  console.log('navigated to view pdf files')
  
  return (
    <WebView source={{ uri: viewerUrl }} startInLoadingState renderLoading={() => <ActivityIndicator size="large" />}/>
  );
};

export default PDFViewer;


