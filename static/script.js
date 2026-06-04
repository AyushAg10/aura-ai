async function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const message = input.value.trim();

    if (message === "") return;

    const welcome = document.querySelector(".welcome");
    if (welcome) welcome.remove();

    chatBox.innerHTML += `<div class="message user">${message}</div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    chatBox.innerHTML += `
        <div class="message bot-message typing">
            <strong>Aura AI</strong><br>Thinking...
        </div>
    `;

    const response = await fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: message })
    });

    const data = await response.json();

    document.querySelector(".typing").remove();

    chatBox.innerHTML += `
        <div class="message bot-message">
            <strong>Aura AI</strong><br>
            ${data.reply}
        </div>
    `;

    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("userInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});