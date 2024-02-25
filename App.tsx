import { useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import Chat from "./chatbot";

export default function App() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  
  useEffect(() => {
    console.log({ permission });
    const sess = Chat.startSession();

    Chat.sendTextMsg(sess, "Can you please summarize my previous instructions ?")
      .then(x => { console.log(x); });

  }, [])

  const askCameraPerm = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
  }

  return (
    <View style={styles.container}>
      {/*<ScrollView style={styles.chat} contentContainerStyle={styles.chatContent}>
        <Text>Open up App.tsx to start working on your app!</Text>
        <StatusBar style="auto" />
      </ScrollView>*/}
      <TouchableOpacity style={styles.openCamera} onPress={requestPermission}>
        <Text style={styles.openCameraText}>
          Open Camera
        </Text>
      </TouchableOpacity>
      <Camera styles={styles.camera} type={CameraType.back}>
        <View style={{ flex: 1, top: 0, bottom: 0, left: 0, right: 0, position: "absolute", width: "100%", height: "100%", backgroundColor: "#36454F" }}></View>
      </Camera>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20
  },

  chat: {
    flex: 1,
    backgroundColor: '#36454F',
    borderRadius: 10,
    width: '100%'
  },
  
  chatContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  openCamera: {
    flex: 0,
    backgroundColor: "#191970",
    padding: 10,
    borderRadius: 10,
    marginTop: 10
  },
  
  openCameraText: {
    color: "#fff"
  },

  camera: {
    flex: 1,
    width: "100%"
  }
});
