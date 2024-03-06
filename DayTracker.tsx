import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Camera, CameraType, ImageType } from 'expo-camera';
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

  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [showCam, setShowCam] = useState(false);
  const [images, setImages] = useState<null | { time : string, uri: string }[]>(null);
  const cameraRef = useRef(null);
  const [chatRes, setChatRes] = useState<null | String[]>(null);
  const [loading, setLoading] = useState(false);

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

  const sendImgMsg = async (base64String) => {
    if (!bot.current) {
      console.log("bot not found!");
      return;
    }
    console.log("prompting..");
    const res = await Chat.sendBase64ImgMsg(bot.current, base64String);
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

  const analyse = async () => {
    if (!images) return;
    const result = [];

    setLoading(true);

    for (const img of images) {
      try {
        const imgBase64 = await imageBase64(img.uri);
        
        if (!imageBase64) {
          result.push("error");
          continue;
        }

        const res = await sendImgMsg(imgBase64);
        if (res) result.push(res);
        else result.push("error"); 
      } catch (e) {
        console.log("error while analysing ", e);
        result.push("error");
      }
    } 
    
    setLoading(false);
    setChatRes([...result]);
  }

  const capture = async () => {
    console.log("capture");
    if (!cameraRef.current) {
      console.log("camera ref not found!");
      return;
    }
    
    const res = await cameraRef.current.takePictureAsync({  base64: true, quality: 0, imageType: ImageType.png });

    if (res?.uri) {
      console.log("img uri: ", res.uri)
      
      const compressed = await compressImge(res.uri);
      
      console.log("compressed uri", compressed.uri);

      if (compressed?.uri) {
        const d ={ time: new Date().toLocaleString(), uri: compressed.uri }; 
        setImages(imgs => imgs ? [ ...imgs,  d ]: [ d ]);
      }
    }
    setShowCam(false);
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity style={styles.openCamera} onPress={toggleCam}>
            <Text style={styles.openCameraText}>
              Capture
            </Text>
        </TouchableOpacity>  

        <TouchableOpacity style={styles.openCamera} onPress={analyse}>
          <Text style={styles.lightText}>
            Analyse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.openCamera} onPress={clearStore}>
          <Text style={styles.lightText}>
            Clear Store
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.preview}>
        {loading && <Text style={styles.lightText}>Analysing...</Text>}
        <ScrollView contentContainerStyle={styles.chatContent}>
          {images && images.map((img, i) => 
              <View key={i} style={{ padding: 10 }}>
                <View style={[styles.left, styles.row]} key={i}>
                  <Text style={[styles.lightText, styles.date]}>{img.time}</Text>
                  <Image source={img.uri} key={i} style={styles.image} placeholder={"img"} contentFit="contain" />
                </View>
                {chatRes && chatRes.length > i && 
                  <Text style={styles.lightText}>
                    Analysis Response: {chatRes[i]}
                  </Text>
                }
              </View>
            )
          }
        </ScrollView>
      </View> 

      {showCam && <View style={styles.cameraContainer}>
        <Camera style={styles.camera} type={CameraType.back} ref={cameraRef} ration="1:1">
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
    justifyContent: 'center'
  },
  lightText: {
    color: "#fff"
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
