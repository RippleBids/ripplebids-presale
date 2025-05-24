// modal/js/walletconnect-custom.js
import { Client as XRPLClient } from 'xrpl';

async function connectWallet() {
  try {
    const client = new XRPLClient('https://s1.ripple.com:51234');
    await client.connect();

    const address = prompt('Enter your XRP wallet address (for testing):');
    if (!address || !address.startsWith('r')) {
      throw new Error('Invalid XRP address');
    }

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

    client.disconnect();
  } catch (error) {
    console.error('Wallet connection error:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Failed to connect wallet: ' + error.message;
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
    const response = await fetch('https://ripplebids-presale.onrender.com/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        xrpAmount: Number(xrpAmount),
        email: email || '',
        destinationAddress: 'rhzLeTCodFnkB8vfCo6Nhj8gQXkjJFZp'
      })
    });

    const data = await response.json();
    if (response.ok) {
      document.getElementById('error-message').textContent = 'Purchase successful!';
      document.getElementById('error-message').style.display = 'block';
      document.getElementById('error-message').style.background = 'green';
    } else {
      throw new Error(data.error || 'Failed to record contribution');
    }
  } catch (error) {
    console.error('Purchase error:', error);
    document.getElementById('error-message').textContent = 'Purchase failed: ' + error.message;
    document.getElementById('error-message').style.display = 'block';
  }
}

async function updateProgress() {
  try {
    const response = await fetch('https://ripplebids-presale.onrender.com/api/contributions');
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

function toggleMenu() {
  const navbarLinks = document.getElementById('navbar-links');
  navbarLinks.classList.toggle('active');
}

window.connectWallet = connectWallet;
window.contribute = contribute;
window.toggleMenu = toggleMenu;
window.addEventListener('load', updateProgress);
