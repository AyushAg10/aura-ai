const input = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");
const historyList = document.getElementById("historyList");
const micBtn = document.getElementById("micBtn");
const voiceStatus = document.getElementById("voiceStatus");

let currentChat = [];
let latestBotReply = "";

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
}

function saveHistory(title) {
    let history = JSON.parse(localStorage.getItem("auraHistory")) || [];
    history.unshift({
        title: title,
        messages: currentChat
    });
    localStorage.setItem("auraHistory", JSON.stringify(history.slice(0, 10)));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("auraHistory")) || [];
    historyList.innerHTML = "";

    history.forEach((chat, index) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerText = chat.title;
        item.onclick = () => openHistory(index);
        historyList.appendChild(item);
    });
}

function openHistory(index) {
    const history = JSON.parse(localStorage.getItem("auraHistory")) || [];
    const chat = history[index];

    chatBox.innerHTML = "";
    currentChat = chat.messages;

    currentChat.forEach(msg => {
        if (msg.role === "user") {
            addUserMessage(msg.content);
        } else {
            addBotMessage(msg.content);
        }
    });

    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

function newChat() {
    window.speechSynthesis.cancel();
    chatBox.innerHTML = `
        <div class="welcome" id="welcome">
            <h1>How can I help you today?</h1>
            <p>Type or use your voice to ask anything.</p>
        </div>
    `;
    currentChat = [];
    latestBotReply = "";
}

function addUserMessage(message) {
    chatBox.innerHTML += `<div class="message user">${escapeHTML(message)}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addBotMessage(message) {
    latestBotReply = message;

    chatBox.innerHTML += `
        <div class="message bot-message">
            <div class="bot-avatar">A</div>
            <div class="bot-content">
                ${escapeHTML(message)}
                <br>
                <button class="speak-btn" onclick="speakText(\`${escapeForJS(message)}\`)">🔊 Read aloud</button>
            </div>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addTyping() {
    chatBox.innerHTML += `
        <div class="message bot-message typing">
            <div class="bot-avatar">A</div>
            <div class="bot-content typing-dots">
                Thinking<span>.</span><span>.</span><span>.</span>
            </div>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    const typing = document.querySelector(".typing");
    if (typing) typing.remove();
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}

function escapeForJS(text) {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");
}

async function sendMessage() {
    const message = input.value.trim();
    if (message === "") return;

    const welcome = document.getElementById("welcome");
    if (welcome) welcome.remove();

    addUserMessage(message);
    currentChat.push({ role: "user", content: message });

    input.value = "";
    input.style.height = "auto";

    addTyping();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        removeTyping();
        addBotMessage(data.reply);
        currentChat.push({ role: "assistant", content: data.reply });

        if (currentChat.length === 2) {
            saveHistory(message.substring(0, 35));
        }

    } catch (error) {
        removeTyping();
        addBotMessage("Something went wrong. Please try again.");
    }
}

function speakText(text) {
    if (!("speechSynthesis" in window)) {
        alert("Text-to-speech is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser. Please use Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micBtn.classList.add("listening");
    voiceStatus.innerText = "Listening... speak now";

    recognition.start();

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        voiceStatus.innerText = "Voice captured. Sending message...";
        micBtn.classList.remove("listening");
        sendMessage();
    };

    recognition.onerror = function() {
        voiceStatus.innerText = "Voice input failed. Try again.";
        micBtn.classList.remove("listening");
    };

    recognition.onend = function() {
        micBtn.classList.remove("listening");
        if (voiceStatus.innerText === "Listening... speak now") {
            voiceStatus.innerText = "Click 🎤 to speak. Aura AI can also read answers aloud.";
        }
    };
}

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

input.addEventListener("input", function() {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
});

loadHistory();