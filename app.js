
const form = document.querySelector("form");

    // Add event listener to the Sign In button
    document.addEventListener("DOMContentLoaded", () => {
        const logInButton = document.getElementById("logInButton");
        const signInButton = document.getElementById("signInButton");
    
        // Handle log in button click
        if (logInButton) {
            logInButton.addEventListener("click", () => {
                window.location.href = "login.html";
            });
        }
    
        // Handle sign in button click
        if (signInButton) {
            signInButton.addEventListener("click", () => {
                window.location.href = "signin.html";
            });
        }
    
        // Restore cart state if saved
        const savedCartState = localStorage.getItem("cartState");
        if (savedCartState) {
            Object.assign(cart, JSON.parse(savedCartState));
            updateCartSummary();
            localStorage.removeItem("cartState");
        }
    });


    form.addEventListener("submit", function (e) {
        e.preventDefault();
        let name = document.getElementById("name").value;
        let email = document.getElementById("email").value;
        let feedback = document.getElementById("feedback").value;

        // Validate if all fields are not empty
        if (name.trim() === "" || email.trim() === "" || feedback.trim() === "") {
            alert("Please fill out all fields.");
            return;
        }

        // Validate email format
        if (!validateEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        // Form data is valid, send email
        sendEmail(name, email, feedback);
    });

    function validateEmail(email) {
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function sendEmail(name, userEmail, feedback) {
        // Replace 'your_email@example.com' with your actual email address
        let email = 'saurabhnanwatkar4@gmail.com';
        let subject = 'Feedback Submission';
        let body = `Name: ${name}%0AEmail: ${userEmail}%0A%0AFeedback: ${feedback}`;

        // Construct the Gmail compose URL
        let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open Gmail compose in a new tab
        window.open(gmailUrl, '_blank');
    }
// Initialize an empty cart object
const cart = {};


const submitOrder = async (orderDetails) => {
    const userId = localStorage.getItem("userId"); // Retrieve user ID
    if (!userId) {
        alert("User not logged in! Please log in first.");
        return;
    }

    const data = { userId, orderDetails };

    try {
        const response = await fetch("http://localhost:3000/save-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert("Order placed successfully!");
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (err) {
        console.error("Error placing order:", err);
        alert("Failed to place order. Please try again.");
    }
};



function handlePayNowButtonClick(orderDetails) {
    const userId = localStorage.getItem("userId"); // Check if user is logged in
    if (!userId) {
        alert("You must log in before placing an order.");
        localStorage.setItem("cartState", JSON.stringify(cart)); // Save cart state
        window.location.href = "login.html"; // Redirect to login page
        return;
    }

    if (orderDetails.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // Call submitOrder to save the order on the server
    submitOrder(orderDetails);
}


function updateCartSummary() {
    const cartSummary = document.getElementById("cart-summary");

    // Check if cart-summary exists
    if (!cartSummary) {
        console.error("Cart summary element not found in the DOM.");
        return;
    }

    cartSummary.innerHTML = ""; // Clear previous summary

    let totalAmount = 0;
    const selectedItems = [];
    const orderDetails = [];

    for (const [itemName, itemDetails] of Object.entries(cart)) {
        if (itemDetails.count > 0) {
            selectedItems.push({
                name: itemName,
                count: itemDetails.count,
                pricePerItem: itemDetails.price,
                totalPrice: itemDetails.count * itemDetails.price,
            });

            // Add each item's row
            const itemRow = document.createElement("div");
            itemRow.className = "flex justify-between my-2";
            itemRow.innerHTML = `
                <span>${itemName} (${itemDetails.count})</span>
                <span>₹${itemDetails.count * itemDetails.price}</span>
            `;
            cartSummary.appendChild(itemRow);

            totalAmount += itemDetails.count * itemDetails.price;

            // Prepare orderDetails for the backend
            orderDetails.push({
                name: itemName,
                quantity: itemDetails.count,
                price: itemDetails.price * itemDetails.count, // Total price for each item
            });
        }
    }

    // Add total amount row
    const totalRow = document.createElement("div");
    totalRow.className = "flex justify-between font-bold mt-4";
    totalRow.innerHTML = `
        <span>Total:</span>
        <span>₹${totalAmount}</span>
    `;
    cartSummary.appendChild(totalRow);

    // Add Pay Now button
    const payNowButton = document.createElement("button");
    payNowButton.id = "payNowButton";
    payNowButton.className =
        "w-full mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors";
    payNowButton.textContent = "Pay Now";

    // Redirect to payment page with data
    payNowButton.addEventListener("click", () => {
        // Save selected items and total amount to localStorage
        localStorage.setItem("orderSummary", JSON.stringify(selectedItems));
        localStorage.setItem("totalAmount", totalAmount);

        // Redirect to the payment page
        window.location.href = "paymentpage.html";
    });

    cartSummary.appendChild(payNowButton);

    console.log("Cart Items:", selectedItems);
}

document.querySelectorAll(".card").forEach((card) => {
    const addToCartBtn = card.querySelector(".add-to-cart-container button");
    const quantityControl = card.querySelector(".quantity-control");
    const incrementBtn = card.querySelector(".increment");
    const decrementBtn = card.querySelector(".decrement");
    const itemName = card.querySelector("h2").innerText;
    const itemPrice = parseInt(card.querySelector("p").innerText.match(/\d+/)[0]); // Extract price from text
    const itemCount = card.querySelector(".item-count");

    // Initialize cart entry for this item
    if (!cart[itemName]) {
        cart[itemName] = { price: itemPrice, count: 0 };
    }

    // Handle Add to Cart button click
    addToCartBtn.addEventListener("click", () => {
        // Hide Add to Cart button and show quantity control
        addToCartBtn.parentElement.classList.add("hidden");
        quantityControl.classList.remove("hidden");

        // Increment count and update UI
        cart[itemName].count = 1;
        itemCount.innerText = cart[itemName].count;

        // Update cart summary
        updateCartSummary();
    });

    // Handle increment button click
    incrementBtn.addEventListener("click", () => {
        cart[itemName].count += 1;
        itemCount.innerText = cart[itemName].count;
        updateCartSummary();
    });

    // Handle decrement button click
    decrementBtn.addEventListener("click", () => {
        if (cart[itemName].count > 0) {
            cart[itemName].count -= 1;
            itemCount.innerText = cart[itemName].count;
            updateCartSummary();

            // If count reaches zero, reset to initial state
            if (cart[itemName].count === 0) {
                quantityControl.classList.add("hidden");
                addToCartBtn.parentElement.classList.remove("hidden");
            }
        }
    });
});

async function handlePayNow(totalAmount) {
    try {
        const response = await fetch(`http://localhost:3000/generate-qr?amount=${totalAmount}`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById("qr-code-container").innerHTML = `<img src="${data.qrCode}" alt="UPI QR Code" />`;
        } else {
            alert("Failed to generate QR Code. Please try again.");
        }
    } catch (err) {
        console.error("Error fetching QR Code:", err);
    }
}



