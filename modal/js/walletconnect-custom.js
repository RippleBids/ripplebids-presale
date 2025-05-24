// js/walletconnect-custom.js
const projectId = 'cfae37059acde5a535f4fe5cc54194ea';
const xrplChain = {
  chainId: 'xrpl:0',
  name: 'XRP Ledger',
  currency: 'XRP',
  rpcUrl: 'https://s1.ripple.com:51234',
  explorerUrl: 'https://xrpscan.com'
};

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      projectId: projectId,
      chains: ['xrpl:0'],
      showQrModal: true
    }
  }
};

const web3Modal = new Web3Modal({
  network: 'mainnet',
  cacheProvider: true,
  providerOptions,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent-color': '#39FF14',
    '--w3m-background-color': '#000000'
  },
  explorerRecommendedWalletIds: [
    'be49f0a78d6ea1beed3804c3a6b62ea71f568d58d9df8097f3d61c7c9baf273d', // Xaman
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0' // Trust Wallet
  ]
});

async function connectWallet() {
  try {
    const provider = await web3Modal.connect();
    const client = new xrpl.Client(xrplChain.rpcUrl);
    await client.connect();

    const address = provider.accounts[0];
    console.log('Connected wallet:', address);

    const accountInfo = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    });
    console.log('Account info:', accountInfo);

    const button = document.querySelector('button[onclick="connectWallet()"]');
    button.textContent = `Connected: ${address.slice(0, 6)}...`;
    button.disabled = true;

    localStorage.setItem('walletAddress', address);

    provider.on('accountsChanged', (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        button.textContent = 'Connect Wallet';
        button.disabled = false;
        localStorage.removeItem('walletAddress');
      } else {
        button.textContent = `Connected: ${accounts[0].slice(0, 6)}...`;
        localStorage.setItem('walletAddress', accounts[0]);
      }
    });

    provider.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
    });

    provider.on('disconnect', (error) => {
      console.log('Disconnected:', error);
      button.textContent = 'Connect Wallet';
      button.disabled = false;
      localStorage.removeItem('walletAddress');
    });

    client.disconnect();
  } catch (error) {
    console.error('Wallet connection error:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Failed to connect wallet. Please try again.';
    errorMessage.style.display = 'block';
  }
}

async function contribute() {
  const xrpAmount = document.getElementById('xrp-amount').value;
  const email = document.getElementById('email').value;
  const walletAddress = localStorage.getItem('walletAddress');

  if (!walletAddress) {
    document.getElementById('error-message').textContent = 'Connect wallet first.';
    document.getElementById('error-message').style.display = 'block';
    return;
  }

  if (!xrpAmount || xrpAmount < 1) {
    document.getElementById('error-message').textContent = 'Enter at least 1 XRP.';
    document.getElementById('error-message').style.display = 'block';
    return;
  }

  try {
    const client = new xrpl.Client('https://s1.ripple.com:51234');
    await client.connect();

    const tx = {
      TransactionType: 'Payment',
      Account: walletAddress,
      Amount: String(Number(xrpAmount) * 1000000), // Convert XRP to drops
      Destination: 'rP9QjD4fXrtYkVZGKjG2iQ8bN7D9Z2uZ6T' // Replace with your presale address
    };

    const result = await client.submitAndWait(tx);
    console.log('Transaction result:', result);

    const response = await fetch('/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        xrpAmount: Number(xrpAmount),
        transactionId: result.result.hash,
        email: email || ''
      })
    });

    const data = await response.json();
    if (response.ok) {
      document.getElementById('error-message').textContent = 'Purchase successful!';
      document.getElementById('error-message').style.display = 'block';
    } else {
      throw new Error(data.error || 'Failed to record contribution');
    }

    client.disconnect();
  } catch (error) {
    console.error('Purchase error:', error);
    document.getElementById('error-message').textContent = 'Purchase failed: ' + error.message;
    document.getElementById('error-message').style.display = 'block';
  }
}

window.connectWallet = connectWallet;
window.contribute = contribute;

function toggleMenu() {
  const navbarLinks = document.getElementById('navbar-links');
  navbarLinks.classList.toggle('active');
}
window.toggleMenu = toggleMenu;

// Update progress bar
async function updateProgress() {
  try {
    const response = await fetch('/api/contributions');
    const data = await response.json();
    const totalXRP = data.totalXRP || 0;
    const maxXRP = 100000; // Adjust to your presale goal
    const progressPercent = Math.min((totalXRP / maxXRP) * 100, 100);
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `Raised: ${totalXRP.toFixed(2)} XRP`;
  } catch (error) {
    console.error('Progress update error:', error);
  }
}
window.addEventListener('load', updateProgress);