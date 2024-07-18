require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const mime = require("mime-types");
const bodyParser = require("body-parser");

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

app.get("/extract-audio-text", async (req, res) => {
  const filePath = req.query.filePath;

  if (!filePath) {
    return res.status(400).send("File path is missing!");
  }

  try {
    const extractedText = await main(filePath);

    console.log(extractedText);

    // Generate content using your model
    const prompt = "Help me return only number of boys in this statement without any additional text: " + extractedText;
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
