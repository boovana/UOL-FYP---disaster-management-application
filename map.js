import MapView, { Marker } from 'react-native-maps';
import React, { useState } from 'react';
import { View, Modal, Button, StyleSheet } from 'react-native';

const LocationPickerModal = ({ visible, onClose, onLocationSelect }) => {
  const [selectedCoord, setSelectedCoord] = useState(null);

  return (
    <Modal visible={visible} animationType="slide">
      <MapView
        style={styles.map}
        onPress={(e) => setSelectedCoord(e.nativeEvent.coordinate)}
        initialRegion={{
          latitude: 12.8797,   // Center on the Philippines by default
          longitude: 121.7740,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {selectedCoord && (
          <Marker coordinate={selectedCoord} />
        )}
      </MapView>
      <Button title="Confirm" onPress={() => {
        onLocationSelect(selectedCoord);
        onClose();
      }} />
      <Button title="Cancel" onPress={onClose} color="red" />
    </Modal>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default LocationPickerModal;
