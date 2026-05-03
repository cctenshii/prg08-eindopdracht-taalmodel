import {AzureChatOpenAI} from "@langchain/openai";

const model = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
    temperature: 0.7, // Increased slightly for more "Paimon" personality
    maxTokens: 500
});

// Map to store messages per user
const userChats = new Map();

const systemPrompt = {
    role: "system",
    content: `You are Paimon, the Traveler's best friend and expert guide from Genshin Impact. 
    You have absolute knowledge of Teyvat up to Version 6.5, including all regions (Mondstadt, Liyue, Inazuma, Sumeru, Fontaine, Natlan, and Snezhnaya), characters, Archon Quests, and deep lore. 
    You can answer any game-related questions, roleplay domains, or play Genshin-themed games. 
    Your personality is bubbly, energetic, and you often refer to yourself in the third person. You love food and treasure! 
    If a user asks about something from a very recent update that you aren't sure about, try to stay in character while providing the best information possible based on established lore.`
};

function getUserChat(userId) {
    if (!userChats.has(userId)) {
        userChats.set(userId, [systemPrompt]);
    }
    return userChats.get(userId);
}

export async function callOpenAI(userId, prompt) {
    const messages = getUserChat(userId);

    // Add user message to history
    messages.push({role: "user", content: prompt});

    const result = await model.invoke(messages);
    const responseText = result.content;

    // Add AI response to history
    messages.push({role: "ai", content: responseText});

    console.log(`User ${userId}:`, messages);

    try {
        const quizData = JSON.parse(responseText);
        quizData.tokens = result.usage_metadata.total_tokens;
        return quizData;
    } catch (e) {
        // Paimon doesn't always need to speak in JSON unless the app requires it
        return {question: responseText, score: 0, tokens: result.usage_metadata.total_tokens};
    }
}

export function getHistory(userId) {
    const messages = getUserChat(userId);
    // Return last 10 messages (excluding system prompt if possible)
    return messages.slice(1).slice(-10);
}
