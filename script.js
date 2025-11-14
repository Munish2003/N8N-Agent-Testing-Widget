
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * NEW FUNCTION: Cleans the bot's response, removing any appended JSON strings.
 * It splits the response by lines and stops at the first line
 * that looks like a JSON object.
 * @param {string} rawText The raw response from n8n
 * @returns {string} The cleaned, user-facing text
 */
/**
 * Cleans a response string from n8n, removing any trailing JSON
 * or Markdown code blocks (like ```json) and the content that follows.
 *
 * @param {string} rawText The raw string response from the n8n webhook.
 * @returns {string} The cleaned text, safe for display.
 */
function cleanN8NResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return '';
    }

    const lines = rawText.split('\n');
    const cleanLines = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if the line is the start of the unwanted JSON data.
        // This now includes the ```json marker.
        if (
            trimmedLine.startsWith('```json') || 
            trimmedLine.startsWith('{') || 
            trimmedLine.startsWith('[')
        ) {
            // Stop processing, we've hit the unwanted part
            break;
        }
        
        // This line is clean, add the original (non-trimmed) line
        // to preserve intentional formatting like newlines.
        cleanLines.push(line);
    }

    // Join the clean lines back together and trim the final result
    // to remove any trailing whitespace or newlines.
    return cleanLines.join('\n').trim();
}

// Typewriter effect function
// Typewriter effect function
async function typewriterEffect(element, text, speed = 20) {
    return new Promise((resolve) => {
        // (Use the clean function here too, just in case)
        const cleanText = cleanN8NResponse(text);
        const paragraphs = cleanText.split('\n').filter(p => p.trim());
        element.innerHTML = '';
        
        if (paragraphs.length === 0) {
             // Handle cases where the text might *only* be JSON
             const p = document.createElement('p');
             p.textContent = "Received a response."; // Fallback
             element.appendChild(p);
             resolve();
             return;
        }

        let currentP = document.createElement('p');
        element.appendChild(currentP);
        
        let paragraphIndex = 0;
        let charIndex = 0;
        
        // Find the chat messages container ONCE
        const chatMessages = element.closest('.chat-messages');

        function type() {
            if (paragraphIndex < paragraphs.length) {
                const currentText = paragraphs[paragraphIndex];
                
                if (charIndex < currentText.length) {
                    currentP.textContent += currentText.charAt(charIndex);
                    charIndex++;
                    
                    // =============================================
                    // === 👇 THIS IS THE MODIFIED SCROLL LOGIC 👇 ===
                    // =============================================
                    if (chatMessages) {
                        // Check if user is scrolled to the bottom (or very close)
                        // We add a 10px buffer for flexibility
                        const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 10;

                        if (isScrolledToBottom) {
                            // Only auto-scroll if the user is already at the bottom
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    }
                    // =============================================
                    
                    setTimeout(type, speed);
                } else {
                    // Move to next paragraph
                    paragraphIndex++;
                    charIndex = 0;
                    
                    if (paragraphIndex < paragraphs.length) {
                        currentP = document.createElement('p');
                        element.appendChild(currentP);
                        setTimeout(type, speed);
                    } else {
                        resolve();
                    }
                }
            } else {
                resolve();
            }
        }
        
        type();
    });
}

// ============================
// LEFT CHATBOT (IMT Support)
// ============================

// const N8N_WEBHOOK_URL_LEFT = 'https://zoximasolutionss.app.n8n.cloud/webhook/700de22e-bc3d-4ff2-9086-0b9b0e347f85/chat';
const N8N_WEBHOOK_URL_LEFT = 'https://zoximasolutionss.app.n8n.cloud/webhook/700de22e-bc3d-4ff2-9086-0b9b0e347f85/chat';
// Webhook URL for inactivity
const N8N_INACTIVITY_WEBHOOK_URL = 'https://zoximasolutionss.app.n8n.cloud/webhook/2b722ab5-f463-4607-a6dc-addc0b3cbd9f';

const chatToggleBtnLeft = document.getElementById('chatToggleBtnLeft');
const chatWindowLeft = document.getElementById('chatWindowLeft');
const chatMessagesLeft = document.getElementById('chatMessagesLeft');
const chatInputLeft = document.getElementById('chatInputLeft');
const sendButtonLeft = document.getElementById('sendButtonLeft');
const minimizeBtnLeft = document.getElementById('minimizeBtnLeft');
const typingIndicatorLeft = document.getElementById('typingIndicatorLeft');

// Generate unique session ID for chatbot
let sessionIdLeft = localStorage.getItem('chatSessionIdIMT');
if (!sessionIdLeft) {
    sessionIdLeft = 'IMT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionIdIMT', sessionIdLeft);
}

console.log('IMT Chat Session ID:', sessionIdLeft);

// ===================================
// === INACTIVITY TIMER LOGIC (MODIFIED) ===
// ===================================

let inactivityTimer;
// Set timeout to 5 minutes (5 * 60 * 1000 milliseconds)
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Handles the inactivity event.
 * Calls the n8n webhook (WITH old session ID), resets the session, clears the chat, 
 * and shows the inactivity message.
 * (MODIFIED to send old session ID)
 */
async function handleInactivity() {
    console.log(`User inactive for 5 minutes. Resetting session: ${sessionIdLeft}`);

    // (NEW) Store the old session ID to send to the webhook
    const oldSessionId = sessionIdLeft;

    // (NEW) Call the inactivity webhook WITH the OLD session ID
    try {
        const webhookUrl = new URL(N8N_INACTIVITY_WEBHOOK_URL);
        webhookUrl.searchParams.append('sessionId', oldSessionId);

        console.log(`Calling inactivity webhook for session: ${oldSessionId}`);
        
        await fetch(webhookUrl.toString(), {
            method: 'GET',
            mode: 'cors'
        });

        console.log('Inactivity webhook called successfully.');
    } catch (error) {
        console.error('Error calling inactivity webhook:', error);
        // We continue with the session reset regardless of webhook success
    }
    
    // 1. Generate a new session ID and save it
    sessionIdLeft = 'IMT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionIdIMT', sessionIdLeft);
    console.log(`New session ID created: ${sessionIdLeft} (Old: ${oldSessionId})`);

    // 2. Clear the chat history from the UI
    chatMessagesLeft.innerHTML = ''; 

    // 3. Add the inactivity message
    const inactivityMessageHtml = `
        <div class="message bot">
            <div class="message-avatar">🎓</div>
            <div class="message-content">
                <p>Session closed due to inactivity.</p>
            </div>
        </div>
    `;
    chatMessagesLeft.innerHTML = inactivityMessageHtml;
    
    // 4. Focus the input field again, as the window is still open
    chatInputLeft.focus();
}

/**
 * Clears any existing inactivity timer and starts a new one.
 */
function resetInactivityTimer() {
    // Clear the old timer
    clearTimeout(inactivityTimer);
    
    // Start a new timer
    inactivityTimer = setTimeout(handleInactivity, INACTIVITY_TIMEOUT_MS);
}

// === END OF INACTIVITY TIMER LOGIC ===


// Toggle chat window (MODIFIED to include timer)
function toggleChatLeft() {
    chatToggleBtnLeft.classList.toggle('active');
    chatWindowLeft.classList.toggle('active');
    
    // Focus on input when opening
    if (chatWindowLeft.classList.contains('active')) {
        setTimeout(() => {
            chatInputLeft.focus();
        }, 300);
        // Start/Reset the timer when chat is opened
        resetInactivityTimer();
    } else {
        // Stop the timer when the chat is closed
        clearTimeout(inactivityTimer);
    }
}

chatToggleBtnLeft.addEventListener('click', toggleChatLeft);
minimizeBtnLeft.addEventListener('click', toggleChatLeft);

// Add message to chat with streaming
async function addMessageLeft(text, sender, shouldStream = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // (MODIFIED) Clean the text right before adding it
    const cleanText = (sender === 'bot') ? cleanN8NResponse(text) : text;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="message-avatar">🎓</div>
            <div class="message-content"></div>
        `;
        chatMessagesLeft.appendChild(messageDiv);
        
        const contentDiv = messageDiv.querySelector('.message-content');
        
        if (shouldStream) {
            // Apply typewriter effect
            await typewriterEffect(contentDiv, cleanText, 20);
        } else {
            // Instant display (for initial message)
            const paragraphs = cleanText.split('\n').filter(p => p.trim());
            contentDiv.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
        }
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                ${cleanText.split('\n').filter(p => p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
            </div>
        `;
        chatMessagesLeft.appendChild(messageDiv);
    }
    
    chatMessagesLeft.scrollTop = chatMessagesLeft.scrollHeight;
}

// Show typing indicator
function showTypingIndicatorLeft() {
    typingIndicatorLeft.classList.add('active');
    chatMessagesLeft.scrollTop = chatMessagesLeft.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicatorLeft() {
    typingIndicatorLeft.classList.remove('active');
}

// Send message to n8n webhook
async function sendMessageToN8NLeft(message) {
    try {
        showTypingIndicatorLeft();
        sendButtonLeft.disabled = true;
        chatInputLeft.disabled = true;

        const response = await fetch(N8N_WEBHOOK_URL_LEFT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatInput: message,
                sessionId: sessionIdLeft // This will be the NEW session ID
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        hideTypingIndicatorLeft();
        sendButtonLeft.disabled = false;
        chatInputLeft.disabled = false;
        chatInputLeft.focus();

        let botReply = '';
        
        if (data.output) {
            botReply = data.output;
        } else if (data.response) {
            botReply = data.response;
        } else if (data.message) {
            botReply = data.message;
        } else if (data.text) {
            botReply = data.text;
        } else if (typeof data === 'string') {
            botReply = data;
        } else {
            botReply = 'I received your message. How else can I help you with IMT Nagpur?';
        }

        // ================================================================
        // === MODIFICATION HERE ===
        // We no longer need to clean it here because addMessageLeft
        // and typewriterEffect will handle cleaning the text.
        // ================================================================
        
        // Add message with streaming effect
        await addMessageLeft(botReply, 'bot', true);

    } catch (error) {
        console.error('Error sending message to n8n:', error);
        hideTypingIndicatorLeft();
        sendButtonLeft.disabled = false;
        chatInputLeft.disabled = false;
        chatInputLeft.focus();
        
        await addMessageLeft(
            'Sorry, I\'m having trouble connecting. Please try again or contact us at contact@imtnagpur.ac.in or call +91-712-2805000.',
            'bot',
            false
        );
    }
}

// Send message function (MODIFIED to reset timer)
function sendMessageLeft() {
    const message = chatInputLeft.value.trim();
    
    if (!message) return;
    
    // Reset inactivity timer on message send
    resetInactivityTimer();
    
    // Add user message
    addMessageLeft(message, 'user', false);
    
    // Clear input
    chatInputLeft.value = '';
    
    // Send to n8n webhook
    sendMessageToN8NLeft(message);
}

// Event listeners
sendButtonLeft.addEventListener('click', sendMessageLeft);

chatInputLeft.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageLeft();
    }
});

// Reset timer when user starts typing
chatInputLeft.addEventListener('input', resetInactivityTimer);


// ============================
// ACCESSIBILITY: KEYBOARD NAVIGATION FOR CHATBOT
// ============================
document.addEventListener('keydown', (e) => {
    // ESC key closes chatbot
    if (e.key === 'Escape' && chatWindowLeft.classList.contains('active')) {
        toggleChatLeft();
    }
});

console.log('✅ IMT Chatbot Loaded Successfully! (with JSON cleaner)');
// Add this function to your script.js
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessagesLeft');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Call this function whenever:
// 1. Chat window opens
document.getElementById('chatToggleBtnLeft').addEventListener('click', function() {
    // your existing toggle code...
    setTimeout(scrollToBottom, 100); // Small delay for animation
});

// 2. New message is added (both bot and user messages)
function addMessage(message, type) {
    // your existing message creation code...
    scrollToBottom();
}

// 3. On page load
window.addEventListener('load', function() {
    scrollToBottom();
});
// Auto-scroll to bottom function
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessagesLeft');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Call on window open
document.getElementById('chatToggleBtnLeft').addEventListener('click', function() {
    // Your existing toggle code
    setTimeout(scrollToBottom, 150);
});

// Call when new message is added
// Add this after appending new message to DOM
scrollToBottom();
