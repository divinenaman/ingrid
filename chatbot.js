import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("");

let SESSION_INIT_PROMPT = (l) => `You are nutritionist and a health expert graduated from Standford university. You give people easy to understand information around food along with healthy eating habits. You have helped many people lead a balanced diet. A friend has contacted you to help him with questions related to food. Please help him with any query he has, he doesn't know anything about being healthy. Please give answers as direct tips and suggestions with good explanation. Answer all the questions with an accurate resolution, take safe assumptions as required. Give actual numbers in easy to understand measurement like 2 tablespoon. Explain how much the meal makes up for the balanced diet and what you can eat for the rest of the day. At the last provide a summary with a direct answer to the question without any nuance.

Help him understand below image with info, alternatives, limits. Use ${l} as the language to explain.`


async function syncPrompt() {
  try {
    const res = await fetch("https://divinenaman.github.io/ingrid/prompts.json");
    const json = await res.json();
    
    console.log({ prompts: json });

    if (json?.one_shot_vision_active) {
      SESSION_INIT_PROMPT = (l) => json.one_shot_vision_active.replace("$lang", l);
    } 
  } catch(e) {
    console.log("sync prompt :", e);
  }
}

function startSession(vision = false, lang = "english") {
  console.log("start chat session :", vision);

  const model = genAI.getGenerativeModel({ model: vision ? "gemini-pro-vision" : "gemini-pro" }); 
  
  const history = 
    [ { role: "user"
      , parts: SESSION_INIT_PROMPT 
      }
    , { role: "model"
      , parts: "Sure, I understood the instructions and will follow it accurately."
      }
    ]
  const sess = vision ? model : model.startChat({ history });

  return {
    text: !vision ? sess : null,
    vision: vision ? sess : null,
    lang
  }
}

async function sendTextMsg(bot, text) {
  if (!bot?.text) return "bot.text not found";
  
  console.log("gemini text : ");

  const res = await bot.text.sendMessage(text);
  const response = await res.response;
  const t = response.text();

  return t;
}

async function sendBase64ImgMsg(bot, base64String) {
  if (!bot?.vision) return "bot.vision not found";

  console.log("gemini vision :");
  
  const initPrompt = SESSION_INIT_PROMPT(bot.lang);
  
  console.log("gemini init prompt :", initPrompt);

  const imagePart = {
    inlineData: {
      data: base64String,
      mimeType: "image/png"
    }
  }
  try {
    const res = await bot.vision.generateContent([initPrompt, imagePart]);
    const response = await res.response;
    const t = response.text();

    return t;
  } catch (e) {
    console.log("sendBase64ImaMsg error: ", e, initPrompt.length, " + ", base64String.length);
    return "error";
  } 
}

function imgToPart(path) {
  // TODO: add base64 conversion logic

  return ""
}

export default { startSession, sendTextMsg, sendBase64ImgMsg, syncPrompt };
