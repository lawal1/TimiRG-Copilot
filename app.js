require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const mime = require("mime-types");
const bodyParser = require("body-parser");
const http = require('https');
const app = express();
const port = process.env.PORT || 3000;
const APIKey = "AIzaSyCT0MXrGRyFXKHQbq0GrSA1fLYbnSNMzJ8";
const genAI = new GoogleGenerativeAI(APIKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

app.use(express.static('public'));
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const main = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("File or File path is missing!");
  }

  const file = fs.readFileSync(filePath);
  const audio = {
    inlineData: {
      data: Buffer.from(file).toString("base64"),
      mimeType: mime.lookup(filePath),
    },
  };
  const prompt = "Extract text from this audio.";
  const result = await model.generateContent([audio, prompt]);
  return result.response.text();
};

async function audioDownloader (url){
  const filePath = `${Date.now()}-audio.wav`
  const file = fs.createWriteStream(filePath);
  const pm = new Promise((resolve, reject) =>{
     http.get(url, function (response) {
      response.pipe(file);
    
      file.on("finish", () => {
        file.close();
        resolve(filePath)
      });

      file.on('error', ()=> {
        reject('error occurred while downloading file')
      })
    });
  })
  return await pm

// return filePath
}

app.post("/extract-audio-text", async (req, res) => {
  const {filePath} = req.body
  if (!filePath) {
    return res.status(400).send("File path is missing!");
  }

  try {
    const path = await audioDownloader(filePath)
    const extractedText = await main(path);

    console.log(extractedText);
    // Generate content using your model
    const prompt = `help return the following information from the text below in the order listed if any is not found list the parameter but make the space empty
                    1. Gestational age
                    2. Fetal size
                      - Crown-rump length (CRL)
                      - Biparietal diameter (BPD)
                      - Head circumference (HC)
                      - Abdominal circumference (AC)
                      - Femur length (FL)
                    3. Fetal position
                    4. Number of fetuses
                    5. Placenta
                      - Location
                      - Grade
                    6. Amniotic fluid
                      - Volume
                      - Index
                    7. Fetal movement
                    8. Fetal heart rate
                    9. Umbilical cord
                      - Number of vessels
                      - Insertion
                     10. Any abnormalities :` + extractedText;
    const content = [{ text: prompt }]; // Wrap the prompt in an object with a "text" property
    const result = await model.generateContent(content);
    
   // const response = result.response;
   const response = result.response.candidates[0].content.parts[0].text.trim(); // Extract the text from the model response

    // Send the extracted text back in the response
    res.status(200).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the file."+error);
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
