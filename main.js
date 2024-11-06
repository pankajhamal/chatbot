const typingForm = document.querySelector(".typing-form");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false; //While giving the answer it will prevent from asking another question
//API Configuration
const API_KEY = `AIzaSyAuQNWFVxKxl_Ze3xRm_kLx4j_AJfZjrqQ`;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const localStorageData = () =>{
    const savedChats  = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //Apply the sorted theme 
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";

    //Restore the saved chats 
    chatList.innerHTML = savedChats || "";
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom 
    document.body.classList.toggle("hide-header", savedChats); 

}
localStorageData();

//Creating a new message element and return it 
const createMessageElement = (content, ...classes) =>{
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//Show typing effect by displaying words one by one 
const showTypingEffect = (text, textElement, incomingMessageDiv) =>{
    const words = text.split(' ');
    let currentWordIndex = 0 ;
    
    const typingInterval = setInterval(() =>{
        //Append each word to the text element with a space 
        textElement.innerText += (currentWordIndex === 0? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        //If all word are displayed 
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating=false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); //Save chats to local storage 
        }
        chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom 
    }, 75)
}

//Fetch response from API based on user message
const generateAPIResponse = async(incomingMessageDiv) =>{
    const textElement =  incomingMessageDiv.querySelector(".text"); //Get the text element

    //Send a post request to API with user's message 
    try{
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": " application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage}]
                }]
            })

        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);
        //Get the API response text and remove asterisks from it  
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');

        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    }catch(error){
        isResponseGenerating=false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

//Showing a loading animation while waiting for API response
const showLoadingAnimation = () =>{
    const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="material-symbols-rounded icon">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom 
generateAPIResponse(incomingMessageDiv);
}

//Copy message to clipboard 
document.addEventListener("DOMContentLoaded", () => {
    window.copyMessage = (copyIcon) => {
        const messageText = copyIcon.parentElement.querySelector(".text").innerText;

        navigator.clipboard.writeText(messageText)
            .then(() => {
                copyIcon.innerText = "done"; // Show the tick icon
                // Reset icon after a short delay
                setTimeout(() => {
                    copyIcon.innerText = "content_copy";
                }, 1500);
            })
            .catch(err => console.error('Failed to copy text: ', err));
    };
});

//Handle sending outgoing message 
const handleOutgoingChat =  () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; //Exit if there is no message

    isResponseGenerating=true;

    const html = `<div class="message outgoing">
            <div class="message-content">
                <img src="images/user.jpg" alt="User Image" class="avatar">
                <p class="text"></p>
            </div>`
    
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); //Clear input field
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the bottom 
    document.body.classList.add("hide-header"); //Hide the header once chat starts
    setTimeout(showLoadingAnimation, 500); //showing the loading animation after a delay
}   

//Set userMessage and handle outgoing message when suggestion is clicked
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click", () =>{
        userMessage=suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

toggleThemeButton.addEventListener("click", () =>{
   const isLightMode =  document.body.classList.toggle("light_mode");
   //Saving the selected theme on the browser local storage by themeColor name 
   localStorage.setItem("themeColor", isLightMode? "light_mode" : "dark_mode");
   toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";
}); 

//Delete all the chats from the local storage when button is clicked 
deleteChatButton.addEventListener("click", () =>{
    if(confirm("Are you sure you want to delete all the message")){

    localStorage.removeItem("savedChats");
    localStorageData();
    }
});

//Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) =>{
    e.preventDefault();

    handleOutgoingChat();
});