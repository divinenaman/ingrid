import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from "expo-image";
import Chat from "./chatbot";
import DayTracker from "./DayTracker";

const langs = ["english", "hindi"]

export default function App() {
  const [active, setActive] = useState("chat");
  const [lang, setLang] = useState(0);
  const [isSync, setIsSync] = useState(0);

  async function sync() {
    setIsSync(1);
    Chat.syncPrompt();
    console.log("sync complete");
    setIsSync(0);
  }
  
  useEffect(() => {
    sync()
  }, [])

  return (
    <View style={[ styles.container, { paddingTop: 40 }]}>
      {isSync == 1 && <Text style={styles.lightText}>syncing...</Text>}
      <View style={{ flexDirection: "row", padding: 20 }}>
        <TouchableOpacity onPress={() => setActive("chat")}>
          <Text style={styles.lightText}>Chat</Text>
        </TouchableOpacity>
        <Text style={[styles.lightText, { paddingHorizontal: 10 }]}>|</Text>
        <TouchableOpacity onPress={() => setActive("tracker")}>
          <Text style={styles.lightText}>Track Day</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{ paddingLeft: 20 }} onPress={() => setLang(i => (i + 1) % langs.length)}>
          <Text style={[styles.lightText, styles.highlight]}>
            {langs[lang]}
          </Text>
        </TouchableOpacity>
      </View>
      {active == "tracker" && <DayTracker lang={langs[lang]} />} 
      {active == "chat" && <ChatFood lang={langs[lang]} />}
    </View>
  );
}

function ChatFood({ lang }) {
  const bot = useRef<null | Camera>(Chat.startSession(true));

  const [permission, requestPermission] = useCameraPermissions();
  const [showCam, setShowCam] = useState(false);
  const [img, setImg] = useState<null | string>(null);
  const cameraRef = useRef(null);
  const [chatRes, setChatRes] = useState<null | String>(null);

  useEffect(() => {
    console.log({ permission });
    bot.current = Chat.startSession(true, lang);
  }, [ lang ]);

  const toggleCam = async () => {
    if (showCam) {
      setShowCam(false);
      return;
    }

    requestPermission();
    setShowCam(true);
  }

  const sendImgMsg = async (base64String) => {
    if (!bot.current) {
      console.log("bot not found!");
      return;
    }
    setChatRes("Loading!!");
    console.log("prompting..");
    const t = new Date().toLocaleString();
    const res = await Chat.sendBase64ImgMsg(bot.current, base64String, t);
    setChatRes(res);
  }
  
  const compressImge = async (uri: string) => {
    try {
      const res = await manipulateAsync(
        uri, 
        [ { resize: { width: 640, height: 480 } } ],
        { format: SaveFormat.PNG, base64: true }
      );

      return {
        uri: res.uri
      , base64: res.base64
      }
    } catch(e) {
      console.log("compressImage error: ", e);
      return null;
    }
  }

  const capture = async () => {
    console.log("capture");
    if (!cameraRef.current) {
      console.log("camera ref not found!");
      return;
    }
    
    const res = await cameraRef.current.takePictureAsync({  base64: true, quality: 0, imageType: "png" });

    if (res?.uri) {
      console.log("img uri: ", res.uri)
      
      const compressed = await compressImge(res.uri);
      
      console.log("compressed uri", compressed.uri);

      if (compressed?.uri) {
        setImg(compressed.uri);
        sendImgMsg(compressed.base64);
      }
    }
    setShowCam(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent}>
        <Text style={styles.lightText}>Your friendly neighborhood AI!</Text>
        <Text style={styles.lightText}>Converse using Images!</Text>
        {img && <Image source={img} style={styles.image} contentFit="contain" />}

        {chatRes && <Text style={styles.lightText}>{chatRes}</Text>}
      </ScrollView>
      <TouchableOpacity style={styles.openCamera} onPress={toggleCam}>
        <Text style={styles.openCameraText}>
          {showCam ? "Close" : "Open"} Camera
        </Text>
      </TouchableOpacity>
      {showCam && <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef} ration="1:1">
          <View style={styles.topRight}>
            <TouchableOpacity onPress={toggleCam}>
              <Text style={styles.lightText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottom}>
            <TouchableOpacity onPress={capture}>
              <View style={styles.circle}></View>
            </TouchableOpacity>
          </View>
        </CameraView>
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
    width: "100%"
  },
  lightText: {
    color: "#fff"
  },
  image: {
    flex: 1,
    width: 200,
    height: 200
  },
  chat: {
    flex: 1,
    backgroundColor: '#36454F',
    borderRadius: 10,
    width: '100%'
  },
  chatContent: {
    padding: 20,
    paddingBottom: 30,
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
  topRight: {
    position: "absolute",
    top: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 20
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
  },
  highlight: {
    color: "#FF0000"
  }
});
