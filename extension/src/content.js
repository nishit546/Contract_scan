console.log("AI Contract Scanner Content Script Loaded");

// Listen for messages from the sidepanel/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_TEXT") {
        const text = document.body.innerText;
        sendResponse({ text: text });
    } else if (request.action === "HIGHLIGHT_RISKS") {
        highlightRisks(request.risks);
        sendResponse({ status: "highlighted" });
    }
});

function highlightRisks(risks) {
    // Simple highlighting logic (this is a POC, robust highlighting is complex)
    // We'll search for the original text and wrap it in a span

    const bodyText = document.body.innerHTML;
    let newBodyText = bodyText;

    risks.forEach(risk => {
        if (risk.original_text && risk.original_text.length > 5) {
            // Escape special regex chars
            const escapedText = risk.original_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedText, 'gi');
            newBodyText = newBodyText.replace(regex, (match) => {
                return `<span style="background-color: #ffcccc; border-bottom: 2px solid red; title: ${risk.description}">${match}</span>`;
            });
        }
    });

    document.body.innerHTML = newBodyText;
}
