const key = "fashion-passport:connected-once";
const status = document.getElementById("status");
const disconnect = document.getElementById("disconnect");

chrome.storage.local.get([key]).then((saved) => {
  const connected = saved[key] === true;
  status.classList.toggle("ready", connected);
  status.querySelector("strong").textContent = connected ? "Passport connected once" : "Connect on the Passport site or first store";
  status.querySelector("span").textContent = connected ? "Ready across compatible Shopify stores" : "You will be asked only once";
  disconnect.hidden = !connected;
});

document.querySelectorAll("[data-url]").forEach((button) => button.addEventListener("click", () => chrome.tabs.create({ url: button.dataset.url })));
disconnect.addEventListener("click", async () => { await chrome.storage.local.set({ [key]: false }); window.close(); });
