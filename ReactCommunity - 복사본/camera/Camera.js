import { CameraView, Camera } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Button,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { CameraType } from 'expo-camera/legacy';

import {
  getModel,
  convertBase64ToTensor,
  startPrediction,
} from '../helpers/TensorHelper';
import { cropPicture } from '../helpers/ImageHelper';

const RESULT_MAPPING = ['개', '고양이'];

export default function  Main ({ children }) {
  const cameraRef = useRef();
  const [isProcessing, setIsProcessing] = useState(false);
  const [presentedShape, setPresentedShape] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [facing, setFacing] = useState(CameraType.back);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button title="Grant permission" onPress={Camera.requestPermissionsAsync} />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  const handleImageCapture = async () => {
    setIsProcessing(true);
    const imageData = await cameraRef.current.takePictureAsync({
      base64: true,
    });
    processImagePrediction(imageData);
  };

  const processImagePrediction = async (base64Image) => {
    const croppedData = await cropPicture(base64Image, 300);
    const model = await getModel();
    const tensor = await convertBase64ToTensor(croppedData.base64);

    const prediction = await startPrediction(model, tensor);

    console.log('Prediction:', prediction);

    const highestPrediction = prediction.indexOf(
      Math.max.apply(null, prediction),
    );

    setPresentedShape(RESULT_MAPPING[highestPrediction]);
  };

  return (
    <View style={styles.container}>
    <Modal visible={isProcessing} transparent={true} animationType="slide">
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <Text>Your current shape is {presentedShape}</Text>
          {presentedShape === '' && <ActivityIndicator size="large" />}
          <Pressable
            style={styles.dismissButton}
            onPress={() => {
              setPresentedShape('');
              setIsProcessing(false);
            }}>
            <Text>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        type={facing}
        autoFocus={true}
      />
      <Pressable
        onPress={() => handleImageCapture()}
        style={styles.captureButton}>
        </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    flex: 0,
    backgroundColor: 'red',
    padding: 10,
    alignSelf: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  button: {
    position: 'absolute',
    bottom: 50,
    left: 20,
  },
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  dismissButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
});