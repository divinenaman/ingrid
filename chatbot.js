import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("");

const SESSION_INIT_PROMPT = `You are nutritionist and a health expert graduated from Standford university. You give people easy to understand information around food along with healthy eating habits. You have helped many people lead a balanced diet. A friend has contacted you to help him with questions related to food. Please help him with any query he has, he doesn't know anything about being healthy. Please give answers as direct tips and suggestions with good explanation. Answer all the questions with an accurate resolution, take safe assumptions as required. Give actual numbers in easy to understand measurement like 2 tablespoon, At the last provide a summary with a direct answer to the question without any nuance.

Help him understand below image with info, alternatives, limits.`

function startSession(vision = false) {
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
    vision: vision ? sess : null
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

  console.log("gemini vision : ");
  
  const imagePart = {
    inlineData: {
      data: base64String,
      mimeType: "image/png"
    }
  }
  try {
    const res = await bot.vision.generateContent([SESSION_INIT_PROMPT, imagePart]);
    const response = await res.response;
    const t = response.text();

    return t;
  } catch (e) {
    console.log("sendBase64ImaMsg error: ", e, SESSION_INIT_PROMPT.length, " + ", base64String.length);
    return "error";
  } 
}

function imgToPart(path) {
  // TODO: add base64 conversion logic

  return ""
}

export default { startSession, sendTextMsg, sendBase64ImgMsg };
