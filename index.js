import express from 'express';
import speech from '@google-cloud/speech';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors'


process.env.GOOGLE_APPLICATION_CREDENTIALS='magicslides-app-e76dca7616d4.json'
const app = express();
const port = process.env.PORT || 7000;


app.use(cors());
// Multer setup for file upload
const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  // Initialize the Google Cloud client
  const client = new speech.SpeechClient();

  try {
    const file = fs.readFileSync(filePath);
    const audioBytes = file.toString('base64');

    const audio = {
      content: audioBytes,
    };
    const config = {
      encoding: 'MP3',
      sampleRateHertz: 16000, // Adjust according to your audio file's properties
      languageCode: 'en-US',
    };
    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

    // Clean up: delete the uploaded file after processing
    fs.unlinkSync(filePath);

    // Send the transcription as a response
    res.status(200).send({ transcription: transcription });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    // Clean up: delete the uploaded file in case of error
    fs.unlinkSync(filePath);
    res.status(500).send({ error: 'Error transcribing audio' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
