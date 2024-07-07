import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, ImageType } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from "expo-image";
import Chat from "./chatbot";
import * as SecureStore from 'expo-secure-store';

async function saveToStore(key, value) {
  await SecureStore.setItemAsync(key, value);
}

async function getValueFromStore(key) {
  try {
    let result = await SecureStore.getItemAsync(key);
    if (result) {
      return result;
    } else {
      console.log("no value in store");
      return null;
    }
  } catch(e) {
    console.log("error getting value from store ", e);
    return null;
  }
}

async function removeFromStore(key) {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (e) {
    console.log("error deleting key from store ", e);
    return false;
  }
}


export default function App({ lang }) {
  const bot = useRef<null | Camera>(Chat.startSession(true));

  const [permission, requestPermission] = useCameraPermissions();
  const [showCam, setShowCam] = useState(false);
  const [images, setImages] = useState<null | { time : string, uri: string }[]>(null);
  const cameraRef = useRef(null);
  const [analyse, setAnalyse] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    console.log({ permission });
    getDayImages();
  }, []);
  
  useEffect(() => {
    bot.current = Chat.startSession(true, lang);
  }, [ lang ]);

  useEffect(() => {
    console.log({images});
    storeImages();
  }, [images]);

  useEffect(() => {
    console.log("start analysis", images, analyse);
    if (analyse) startAnalysis();
  }, [analyse])

  const getStoreKey = () => {
    const t = new Date().toLocaleDateString();
    const key = `ingrid-${t}-images`.replaceAll("/", "-");
    return key;
  }

  const getDayImages = async () => {
    const key = getStoreKey(); 
    const storedImages = await getValueFromStore(key);
  
    if (storedImages) {
      try {
        const images = JSON.parse(storedImages); // expecting a array
        console.log("stored images", images);
        setImages(images);
      } catch (e) {
        console.log("error while parsing store response ", e);
        return;
      }
    }
  }

  const storeImages = async () => {
    const key = getStoreKey();
    if (!images) return;
    
    await saveToStore(key, JSON.stringify([...images]));
  }

  const clearStore = async () => {
    const res = await removeFromStore(getStoreKey());
    if (res) setImages(null);
  }

  const toggleCam = async () => {
    if (showCam) {
      setShowCam(false);
      return;
    }

    requestPermission();
    setShowCam(true);
  }

  const sendImgMsg = async (base64String, localTime) => {
    if (!bot.current) {
      console.log("bot not found!");
      return;
    }
    console.log("prompting..");
    const res = await Chat.sendBase64ImgMsg(bot.current, base64String, localStorage, "identity_meal");
    return res;
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
  
  const imageBase64 = async (uri: string) => {
    try {
      const res = await manipulateAsync(
        uri, 
        [],
        { format: SaveFormat.PNG, base64: true }
      );

      return res.base64;
    } catch(e) {
      console.log("imageBase64 error: ", e);
      return null;
    }
  }
  
  const trackDay = async () => {
    if (!images || images.length == 0) return;
    setTracking(true);
    
    const meals = images.map((x, i) => x.info ? `Meal ${i + 1} :: Time : ${x.time}, Info: ${x.info}` : null).join("\n\n");

    console.log("meals => ", meals);

    const res = await Chat.sendTextMsg(bot.current, meals, "track_day");
    
    setResult(res ? res : "error");
    setTracking(false);
  }

  const startAnalysis = async () => {
    if (!images) return;
    
    const copy = []

    for (let i = 0; i < images.length; i++) {
      try {  
        console.log("analysing", img);

        const img = images[i];
        
        if (img.info) {
          copy.push(img);
          continue;
        }

        const imgBase64 = await imageBase64(img.uri);
        
        if (!imageBase64) {
          copy.push(img);
          continue;
        }
        const res = await sendImgMsg(imgBase64, img.time);
        copy.push({...img, info: res ? res : null });
      } catch (e) {
        console.log("error while analysing ", e);
      }
    } 
    
    setAnalyse(false);
    setImages([...copy]);
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
        const d ={ time: new Date().toLocaleString(), uri: compressed.uri, info: null }; 
        setImages(imgs => imgs ? [ ...imgs,  d ]: [ d ]);
        setAnalyse(true);
      }
    }
    setShowCam(false);
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity style={analyse ? styles.disabled : styles.openCamera} onPress={toggleCam} disabled={analyse || tracking}>
            <Text style={styles.openCameraText}>
              Capture
            </Text>
        </TouchableOpacity>  

        <TouchableOpacity style={analyse ? styles.disabled : styles.openCamera} onPress={trackDay} disabled={analyse || tracking}>
          <Text style={styles.lightText}>
            Track
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={analyse ? styles.disabled : styles.openCamera} onPress={clearStore} disabled={analyse || tracking}>
          <Text style={styles.lightText}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.preview}>
        {analyse && <Text style={styles.lightText}>Analysing...</Text>}
        <ScrollView contentContainerStyle={styles.chatContent}>
          {images && images.map((img, i) => 
              <View key={i} style={{ padding: 10 }}>
                <View style={[styles.left, styles.row]} key={i}>
                  <Text style={[styles.lightText, styles.date]}>{img.time}</Text>
                  <Image source={img.uri} key={i} style={styles.image} placeholder={"img"} contentFit="contain" />
                </View>
                <Text style={styles.lightText}>
                  Analysis Response: { analyse && !img.info ? "" : img.info ? img.info : "error" }
                </Text>
              </View>
            )
          }
          <Text style={styles.highlightText}>
            {result ? `Report: ${result}` : ""}
          </Text>
        </ScrollView>
      </View> 

      {showCam && <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={"back"} ref={cameraRef} ration="1:1">
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
    justifyContent: 'center'
  },
  lightText: {
    color: "#fff"
  },
  highlightText: {
    color: "#FFC300",
    padding: 20
  },
  image: {
    width: 200,
    height: 200,
    backgroundColor: "#ffffff"
  },
  preview: {
    flex: 1,
    backgroundColor: '#36454F',
    borderRadius: 10,
    width: "100%",
  },
  chatContent: {
    alignItems: 'center',
    paddingBottom: 30
  },
  row: {
    flexDirection: "row"
  },
  date: {
    padding: 20,
    flex: 1,
    height: "100%"
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  left: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 30,
    width: "100%"
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
  disabled: {
    flex: 0,
    backgroundColor: "#191970",
    opacity: 0.5,
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
