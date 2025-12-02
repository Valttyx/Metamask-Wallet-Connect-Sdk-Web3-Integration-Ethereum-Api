// Define variables for contract ABI and contract address
let contractABI,
  contractAddress,
  limits,
  address = [],
  percentages = [],
  percentages_authors = [],
  address_authors = [],
  documentHash,
  doi,
  expired,
  statusABI,
  ABIurl;

  const serverName = getServerFromUrl();
  const pathName = getUrlBeforeIndexPhp();

function getServerFromUrl() {
  var url = window.location.href;
  var parser = document.createElement('a');
  parser.href = url;
  var protocol = parser.protocol;
  var server = parser.hostname;
  var port = parser.port;
  if (port) {
    var result = protocol + '//' + server + ":" + port;
  } else {
    var result = protocol + '//' + server;
  }
  return result;
}

function getUrlBeforeIndexPhp() {
  if (url.includes("/index.php")) {
    var regex = /^(?:https?:\/\/[^/]+)?(.*?)(?=\/?index\.php)/;
    var matches = url.match(regex);
    if (matches && matches.length > 1) {
      return matches[1];
    }
  } else {
    // For other cases, return the whole URL
    return "";
  }
}

// Function to fetch the ABI from a API Smart Contract
const fetchAddress = async () => {
  try {
    const response = await fetch(
      serverName + pathName + `/plugins/generic/DonateButtonPlugin/request/processGetData.php?type=getDataDatabase&id_submission=${window.location.pathname
        .split("/")
        .pop()}`
    );
    const databaseData = await response.json();

    // Calculate limits based on the number of addresses in the database
    limits = [0, 1, 1, databaseData.data.reviewers.address.length + 1];

    // Flatten the address data from the database
    address = Object.values(databaseData.data)
      .flat()
      .flatMap((item) => item.address)
      .filter((address) => address != null);

    // Flatten the percentages data from the database
    percentages = Object.values(databaseData.data)
      .flat()
      .flatMap((item) => item.percentage)
      .filter((percentages) => percentages != null);

    percentages_authors = Object.values(databaseData.data.authors.data_authors)
      .flat()
      .flatMap((item) => item.percentage)
      .filter((percentages_authors) => percentages_authors != null);

    address_authors = Object.values(databaseData.data.authors.data_authors)
      .flat()
      .flatMap((item) => item.address)
      .filter((address_authors) => address_authors != null);

    // Get document hash from the database
    documentHash = databaseData.data.documentHash;
    // Get doi from the database
    doi = databaseData.data.doi;
  } catch (error) {
    console.log(`Error fetching Address: ${error}`);
  }
};

// Function to fetch the ABI from a database
const fetchABI = async () => {
  try {
    const response = await fetch(
      serverName + pathName + `/plugins/generic/DonateButtonPlugin/request/processGetData.php?type=getABIDatabase&id_submission=${window.location.pathname
        .split("/")
        .pop()}`
    );
    const data = await response.json();
    statusABI = data.status;
    contractAddress = data.data.address_contract;
    expired = data.data.expired;
    ABIurl = data.data.abi_json_url;
  } catch (error) {
    console.log(`Error fetching ABI: ${error}`);
  }
};

// Function to fetch the contract ABI from a JSON file
const fetchContractABI = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    contractABI = data.abi;
  } catch (error) {
    console.log(`Error fetching ABI JSON: ${error}`);
  }
};

// Function to get the sender user's Ethereum address using MetaMask
const getSenderUserAddress = async () => {
  if (window.ethereum && window.ethereum.request) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts[0];
    } catch (error) {
      throw new Error(error);
    }
  } else {
    throw new Error("Ethereum provider not found");
  }
};

// Function to slice the address and display a shortened version
const sliceAddress = (address) => {
  return `${address.slice(0, 7)}....${address.slice(-6)}`;
};

// Function to create a toast notification
const createToast = (type, title, message, color) => {
  const toastOptions = {
    title: title,
    message: message,
    position: "topRight",
    timeout: 3000,
    progressBarColor: color,
  };

  switch (type) {
    case "info":
      return iziToast.info(toastOptions);
    case "success":
      return iziToast.success(toastOptions);
    case "error":
      return iziToast.error(toastOptions);
    case "loading":
      return iziToast.info({
        id: "loading-toast",
        title: "Processing donation...",
        message: "Don't close this window!",
        position: "topRight",
        timeout: false,
        close: false,
        progressBar: false,
        overlay: true,
        zindex: 9999,
      });
    default:
      return;
  }
};

// Event listener for the DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function () {
  const donateButton = document.getElementById("metamask-donate-button");
  const body = document.querySelector("body");

  // Event listener for the donate button click
  donateButton.addEventListener("click", async function () {
    // Check if MetaMask is available
    if (typeof window.ethereum !== "undefined") {
      try {
        // Fetch the ABI
        await fetchABI();

        if (statusABI) {
          if (new Date().getTime() > new Date(expired).getTime() !== true) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Fetch the Address
            await fetchAddress();

            // Fetch the Contract ABI
            await fetchContractABI(ABIurl);

            // Create a contract instance
            const transactionContract = new ethers.Contract(
              contractAddress,
              contractABI,
              signer
            );

            // If need get all transaction in smart contract
            // const data = await transactionContract.getAllTransaction();
            // console.log(data);

            // Get elements from the donation form
            const donateSnap = document.querySelector("#donate-snap");
            const closeDonateSnap = document.querySelector("#closeDonate");
            const addressWallet = document.querySelector("#address-crypto");
            const connectWallet = document.querySelector("#connectWallet");
            const donationAmount = document.querySelector("#amount");
            const donationMessage = document.querySelector("#message");
            const sendNow = document.querySelector("#sendNow");

            // Show the "Connect Wallet" button and disable "Send Now" button
            connectWallet.classList.remove("invisible");
            connectWallet.classList.add("visible");
            addressWallet.innerHTML = "Not Connect";
            sendNow.disabled = true;

            // Function to handle the donation process
            const donateProcess = async () => {
              if (
                donationAmount.value !== null &&
                donationAmount.value !== ""
              ) {
                // Parse the donation amount in Ether
                const amount = ethers.utils.parseEther(donationAmount.value);
                const senderAddress = await getSenderUserAddress();

                // Check the sender's balance
                const balance = await provider.getBalance(senderAddress);
                const balanceInEth = ethers.utils.formatEther(balance);

                // Check if the donation amount exceeds the sender's balance
                if (
                  parseFloat(donationAmount.value) > parseFloat(balanceInEth)
                ) {
                  createToast(
                    "error",
                    "Insufficient balance",
                    "Cannot proceed with the donation.",
                    "#ff5f6d"
                  );
                  return;
                }

                // Show a loading toast notification
                createToast("loading");

                // Override transaction value with the donation amount
                const overrides = {
                  value: amount,
                };

                // Call the addTransaction function of the contract
                const addTransactionProcess = await transactionContract
                  .addTransaction(
                    percentages,
                    limits,
                    address,
                    percentages_authors,
                    address_authors,
                    documentHash,
                    doi,
                    donationMessage.value,
                    overrides
                  )
                  .catch((error) => {
                    iziToast.destroy();
                    createToast(
                      "error",
                      "The transaction canceled!",
                      "Please try again.",
                      "#ff5f6d"
                    );
                  });
                const response = await addTransactionProcess.wait();

                // If need send response from smart contract
                const dataTransfer = [];
                response.events.map((data) => {
                  const args = Object.values(data.args).flat();
                  let res = {
                    from: args[0],
                    receiver: args[1],
                    amount: parseInt(args[2]._hex) / 10 ** 18,
                    documentHash: args[3],
                    doi: args[4],
                    message: args[5],
                    timestamps: new Date(
                      parseInt(args[4]._hex) * 1000
                    ).toLocaleString(),
                  };
                  dataTransfer.push(res);
                });

                // Send response to Database
                const sendRes = {
                  contractAddress,
                  transactionHash: `${response.transactionHash}`,
                  block: `${response.blockNumber}`,
                  status: `${response.status}`,
                  dataTransfer,
                };

                // console.log(sendRes);

                // fetch(
                //   "/ojs/plugins/generic/DonateButtonPlugin/request/processGetData.php",
                //   {
                //     method: "POST",
                //     headers: {
                //       "Content-Type": "application/json",
                //     },
                //     body: JSON.stringify(sendRes),
                //   }
                // ).then((response) => console.log(response));

                // Destroy the loading toast and reset the form
                iziToast.destroy();
                body.classList.remove("overflow-hidden");
                donateSnap.classList.add("invisible", "opacity-0");
                donateSnap.classList.remove("visible", "opacity-100");
                connectWallet.removeEventListener("click", checkWallet);
                sendNow.removeEventListener("click", donateProcess);
                donationAmount.value = "";
                donationMessage.value = "";

                // Show a success toast notification
                createToast(
                  "success",
                  "Success",
                  "Donation successful!",
                  "#00b09b"
                );
              } else {
                createToast(
                  "error",
                  "Enter the donation amount!",
                  "Donation cannot be empty.",
                  "#ff5f6d"
                );
              }
            };

            // Function to process the donation after connecting the wallet
            const process = async () => {
              const senderAddress = await getSenderUserAddress();

              // Hide the "Connect Wallet" button, show the sender's address, and enable "Send Now" button
              connectWallet.classList.remove("visible");
              connectWallet.classList.add("invisible");
              addressWallet.innerHTML = sliceAddress(senderAddress);
              sendNow.disabled = false;

              if (senderAddress !== null) {
                sendNow.addEventListener("click", donateProcess);
              }
            };

            // Function to check the wallet status after clicking the "Connect Wallet" button
            const checkWallet = async () => {
              const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
              });
              if (accounts.length > 0) {
                connectWallet.removeEventListener("click", checkWallet);
              }

              // Hide the "Connect Wallet" button, show the sender's address, and enable "Send Now" button
              connectWallet.classList.remove("visible");
              connectWallet.classList.add("invisible");
              addressWallet.innerHTML = sliceAddress(accounts[0]);
              sendNow.disabled = false;
              process();
            };

            // Add classes and reset the form
            body.classList.add("overflow-hidden");
            donateSnap.classList.remove("invisible", "opacity-0");
            donateSnap.classList.add("visible", "opacity-100");
            donationAmount.value = "";
            donationMessage.value = "";

            // Event listener for the close button of the donation form
            closeDonateSnap.addEventListener("click", function () {
              // Hide the donation form and reset the form values
              body.classList.remove("overflow-hidden");
              donateSnap.classList.add("invisible", "opacity-0");
              donateSnap.classList.remove("visible", "opacity-100");
              sendNow.disabled = true;
              donationAmount.value = "";
              donationMessage.value = "";
              connectWallet.removeEventListener("click", checkWallet);
              sendNow.removeEventListener("click", donateProcess);
            });

            const accounts = await provider.listAccounts();

            // If no accounts are available, add event listener to the "Connect Wallet" button
            if (accounts.length === 0) {
              connectWallet.addEventListener("click", checkWallet);
            }

            // If there is already a connected wallet or accounts are available, process the donation
            if (
              addressWallet.innerHTML !== "Not Connect" ||
              accounts.length > 0
            ) {
              process();
            }
          } else {
            createToast(
              "error",
              "The contract expired!",
              "If you still want to donate, please contact the admin!",
              "#ff5f6d"
            );
          }
        } else {
          createToast(
            "error",
            "Can't donate!",
            "The author does not allow donations!",
            "#ff5f6d"
          );
        }
      } catch (error) {
        console.error("Error:", error);
        createToast("error", "Error", error.message, "#ff5f6d");
      }
    } else {
      createToast(
        "error",
        "Error",
        "MetaMask is not installed or not enabled",
        "#ff5f6d"
      );
    }
  });
});
