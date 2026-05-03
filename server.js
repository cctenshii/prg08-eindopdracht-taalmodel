import express from 'express';
import {callOpenAI, getHistory} from './chat.js';

const app = express();
app.use(express.json());

app.use(express.static("public"));

app.get('/api/test', async (req, res) => {
    const result = await callOpenAI("test-user", "test");
    res.json({response: result});
});

app.post('/api/chat', async (req, res) => {
    const {userId, prompt} = req.body;
    console.log(`User ${userId} asked for ${prompt}`);
    const result = await callOpenAI(userId, prompt);
    res.json(result);
});

app.post('/api/gethistory', (req, res) => {
    const {userId} = req.body;
    const history = getHistory(userId);
    res.json(history);
});

app.listen(3000, () => console.log('Server is running on port 3000'));
