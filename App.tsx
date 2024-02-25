import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import Chat from "./chatbot";

export default function App() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [showCam, setShowCam] = useState(false);

  useEffect(() => {
    console.log({ permission });
    //    const sess = Chat.startSession();
    //
    //    Chat.sendTextMsg(sess, "Can you please summarize my previous instructions ?")
    //      .then(x => { console.log(x); });
    //
  }, [])

  const toggleCam = async () => {
    if (showCam) {
      setShowCam(false);
      return;
    }

    requestPermission();
    setShowCam(true);
  }

  const capture = () => {
    console.log("capture");
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent}>
        <Text>Open up App.tsx to start working on your app!</Text>
      </ScrollView>
      <TouchableOpacity style={styles.openCamera} onPress={toggleCam}>
        <Text style={styles.openCameraText}>
          {showCam ? "Close" : "Open"} Camera
        </Text>
      </TouchableOpacity>
      {showCam && <View style={styles.cameraContainer}>
        <Camera style={styles.camera} type={CameraType.back}>
          {/* <View style={styles.top}>
            <TouchableOpacity onPress={toggleCam}>
              <View style={styles.closeCam}>
                <Text style={styles.closeCamText}>Close</Text>
              </View>
            </TouchableOpacity>
          </View>
          */}
          <View style={styles.bottom}>
            <TouchableOpacity onPress={capture}>
              <View style={styles.circle}></View>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100
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
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  top: {
    position: "absolute",
    top: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "flex-end"
  },
  openCamera: {
    flex: 0,
    backgroundColor: "#191970",
    padding: 10,
    borderRadius: 10,
    margin: 10
  },
  openCameraText: {
    color: "#fff"
  },
  cameraContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    paddingBottom: 8
  },
  camera: {
    flex: 1
  },
  closeCam: {
    width: 40,
    padding: 2,
    margin: 5,
    backgroundColor: "#191970"
  },
  closeCamText: {
    color: "#fff"
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "#191970",
    marginBottom: 10,
  }
});
