import {micromark} from 'https://esm.sh/micromark@3?bundle'

const btn = document.getElementById('button');
const form = document.getElementById('chat-form');
const input = document.getElementById('input');
const chatContainer = document.getElementById('chat-container');
const scoreDisplay = document.getElementById('score-display');

// Handle unique userId per user via localStorage
let userId = localStorage.getItem("userid");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userid", userId);
}

// Initial history fetch when the page loads
async function loadHistory() {
    try {
        const response = await fetch("/api/gethistory", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userId})
        });
        const history = await response.json();

        // Display history in chat container
        history.forEach(msg => {
            if (msg.role === 'ai') {
                try {
                    // Try to parse AI content as quiz JSON
                    const quizData = JSON.parse(msg.content);
                    addMessageBubble(quizData.question, 'ai', null, quizData.score);
                    // Update current score display if it exists
                    if (scoreDisplay) scoreDisplay.textContent = `Score: ${quizData.score}`;
                } catch (e) {
                    addMessageBubble(msg.content, 'ai');
                }
            } else {
                addMessageBubble(msg.content, 'user');
            }
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

loadHistory();

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = input.value.trim();
    if (prompt) {
        await sendChat(prompt);
        input.value = '';
    }
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
});

async function sendChat(prompt) {
    // Add user message bubble
    addMessageBubble(prompt, 'user');

    btn.disabled = true;
    btn.innerText = "Loading...";

    try {
        const data = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userId, prompt}) // Passing userId
        });

        if (!data.ok) {
            throw new Error(`Server error: ${data.status}`);
        }

        const result = await data.json();

        const utterance = new SpeechSynthesisUtterance(result.question);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);

        console.log("Question:", result.question);
        console.log("Score:", result.score);
        console.log("Tokens:", result.tokens);

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${result.score}`;
        }

        // Add AI response bubble
        addMessageBubble(result.question, 'ai', result.tokens, result.score);
    } catch (error) {
        console.error('Error:', error);
        addMessageBubble('Sorry, something went wrong. Please try again.', 'ai');
    }

    btn.disabled = false;
    btn.innerText = "Send Message";
}

function addMessageBubble(text, type, tokens = null, score = null) {
    const content = text || "";

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${type}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    if (type === 'ai') {
        messageContent.innerHTML = micromark(content);
    } else {
        messageContent.textContent = content;
    }
    bubble.appendChild(messageContent);

    if (tokens !== null || score !== null) {
        const metadataDisplay = document.createElement('div');
        metadataDisplay.className = 'token-count';

        const parts = [];
        if (score !== null) parts.push(`score: ${score}`);
        if (tokens !== null) parts.push(`tokens: ${tokens}`);

        metadataDisplay.textContent = parts.join(' | ');
        bubble.appendChild(metadataDisplay);
    }

    const row = document.createElement('div');
    row.className = `message-row ${type}-row`;

    if (type === 'ai') {
        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.src = 'images/paimon.png';
        avatar.alt = 'Paimon Avatar';
        row.appendChild(avatar);
    }

    row.appendChild(bubble);
    chatContainer.appendChild(row);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
