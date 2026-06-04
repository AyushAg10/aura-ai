const input = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");
const historyList = document.getElementById("historyList");

let currentChat = [];

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
    chatBox.innerHTML = `
        <div class="welcome" id="welcome">
            <h1>How can I help you today?</h1>
            <p>Ask anything, write code, learn concepts, or generate ideas.</p>
        </div>
    `;
    currentChat = [];
}

function addUserMessage(message) {
    chatBox.innerHTML += `<div class="message user">${escapeHTML(message)}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addBotMessage(message) {
    chatBox.innerHTML += `
        <div class="message bot-message">
            <div class="bot-avatar">A</div>
            <div class="bot-content">${escapeHTML(message)}</div>
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