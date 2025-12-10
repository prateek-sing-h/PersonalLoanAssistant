let step = 0;
let userData = {};

// Send message when user clicks button or presses Enter
function sendMessage(){
    let input = document.getElementById("userInput").value.trim();
    if(input === "") return;

    addMessage(input, "user");
    document.getElementById("userInput").value = "";

    setTimeout(() => handleBotSteps(input), 500);
}

// Add a chat bubble
function addMessage(text, type){
    let chatBox = document.getElementById("chatBox");
    let message = document.createElement("div");
    message.className = type + "-message";
    message.innerText = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

/* Typing indicator helpers */
function showTyping() {
    document.getElementById("typingIndicator").classList.remove("hidden");
}
function hideTyping() {
    document.getElementById("typingIndicator").classList.add("hidden");
}

// Wrapper so every bot reply shows typing first
function botReply(text){
    showTyping();
    setTimeout(() => {
        hideTyping();
        addMessage(text, "bot");
    }, 800);
}

/* EMI Calculator
   EMI = P * r * (1+r)^n / ((1+r)^n - 1)
   P = principal (loan)
   r = monthly interest rate
   n = tenure in months
*/
function calculateEMI(principal, annualRate, months){
    let r = annualRate / 12 / 100;      // monthly interest rate
    if (r === 0) return principal / months;
    let emi = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
}

/* Main bot flow */
function handleBotSteps(input){

    switch(step){

        // 0: First interaction
        case 0:
            botReply("Hello! 👋 I am your AI Personal Loan Assistant. Let's start with your full name.");
            step++;
            break;

        // 1: Name captured → ask PAN
        case 1:
            userData.name = input;
            botReply(`Nice to meet you, ${userData.name}. Please enter your PAN number (10 characters).`);
            step++;
            break;

        // 2: PAN validation → ask income
        case 2:
            if(input.length !== 10){
                botReply("❌ PAN must be exactly 10 characters. Kindly re-enter your PAN.");
                return;
            }
            userData.pan = input;
            botReply("✅ PAN Verified Successfully.");
            botReply("Now please enter your *monthly income* in ₹ (for example: 35000).");
            step++;
            break;

        // 3: Income validation → ask loan amount
      case 3:
    let income = Number(input);

    if(isNaN(income)){
        botReply("⚠️ Please enter a valid number for income.");
        return;
    }

    // Lie Detection Logic
    if(income < 8000){
        botReply("⚠️ This income seems too low for personal loans. Please re-enter your correct monthly income.");
        return;
    }
    if(income > 200000 && income <= 500000){
        botReply("⚠️ High-income detected. Kindly confirm this amount as incomes above ₹2 Lakhs typically require document proof.");
        return;
    }
    if(income > 500000){
        botReply("❗ This income appears unrealistic for standard personal loan applications. Please enter a realistic monthly income.");
        return;
    }

    userData.income = income;
    botReply("Great! Now tell me how much loan amount you need (in ₹).");
    step++;
    break;


        // 4: Loan amount → ask tenure
        case 4:
            let loanAmount = Number(input);
            if(isNaN(loanAmount) || loanAmount <= 0){
                botReply("⚠️ Please enter a valid loan amount in digits.");
                return;
            }
            if(loanAmount < 10000){
                botReply("💡 Minimum recommended personal loan amount is ₹10,000. Please enter a higher amount if needed.");
                return;
            }

            userData.loan = loanAmount;
            botReply("For how many months would you like to pay the EMI? (e.g., 12, 24, 36, 48, 60)");
            step++;
            break;

        // 5: Tenure → do full eligibility + EMI + sanction
        case 5:
            let tenure = Number(input);
            if(isNaN(tenure) || tenure < 6){
                botReply("⚠️ Please enter a valid tenure in months (minimum 6). Example: 12, 24, 36.");
                return;
            }
            if(tenure > 84){
                botReply("⚠️ Maximum tenure for this assistant is 84 months (7 years). Please enter a lower tenure.");
                return;
            }

            userData.tenure = tenure;

            botReply("Thank you. Let me analyse your eligibility and generate an offer… 🔍");

            // mock credit score
            let score = Math.floor(650 + Math.random() * 100);
            userData.creditScore = score;

            setTimeout(() => {
                botReply(`📊 Your simulated credit score is: ${score}.`);

                // Check basic eligibility based on income
                let maxEligibleLoan = userData.income * 15;

                // EMI for this request
                let interestRate = 12.5;  // fixed example rate
                let emi = calculateEMI(userData.loan, interestRate, userData.tenure);

                let maxAffordableEmi = userData.income * 0.5; // EMI should not exceed 50% income

                // Conditions:
                // 1) loan <= maxEligibleLoan
                // 2) emi <= 50% of income
                if(userData.loan <= maxEligibleLoan && emi <= maxAffordableEmi){
                    botReply("✅ You are *eligible* for this loan based on your income and requested tenure.");
                    userData.emi = emi;
                    userData.interestRate = interestRate;
                    showSanctionLetter();
                } else {
                    botReply("❌ Based on our internal checks, this request does not meet the eligibility criteria.");

                    if(userData.loan > maxEligibleLoan){
                        botReply(`💡 Your requested amount ₹${userData.loan} is higher than your eligible limit of approximately ₹${maxEligibleLoan}.`);
                    }
                    if(emi > maxAffordableEmi){
                        botReply(`💸 The estimated EMI of ₹${emi} is more than 50% of your monthly income, which is considered risky.`);
                    }

                    let suggestedLoan = Math.floor(maxAffordableEmi * userData.tenure); // rough suggestion
                    botReply(`✅ You may try a *lower loan amount* or *higher tenure*. For example, you could try around ₹${suggestedLoan} with the selected tenure.`);
                }
            }, 1500);

            step++;
            break;
    }
}

/* SANCTION LETTER with EMI + tenure */
function showSanctionLetter(){
    let letter = `
📄 SANCTION LETTER (SIMULATED)

Applicant Name : ${userData.name}
PAN Number     : ${userData.pan}

Approved Loan Amount : ₹${userData.loan}
Tenure              : ${userData.tenure} months
Interest Rate       : ${userData.interestRate}% p.a.
Estimated EMI       : ₹${userData.emi}
Credit Score Used   : ${userData.creditScore}

Note: This is a demo AI-generated sanction letter for prototype purposes only.

Thank you for using our AI Personal Loan Assistant!
`;

    setTimeout(() => {
        botReply(letter);
    }, 1000);
}
