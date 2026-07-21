import type { WalletKitLabelPack } from "../types";

export const en: WalletKitLabelPack = {
  connectModal: {
    title: "Connect Wallet",
    subtitle: "",
    allWallets: "All Wallets",
    back: "Back",
    close: "Close",
    connecting: "Connecting",
    continueInWallet: "Continue in",
    acceptRequest: "Accept connection request in the wallet",
    tryAgain: "Try again",
    getWallet: "Get",
    searchWallet: "Search wallet",
    searchPlaceholder: "Search wallet",
    noWalletsFound: "No TRON wallets found",
    poweredBy: "Powered by TRON Wallet Kit",
    unavailable: "Unavailable",
    ready: "Ready",
    installed: "Installed",
    notInstalled: "Not installed",
    qrCode: "QR code",
    tron: "TRON",
    scanQr: "Scan this QR Code with your phone",
    dontHave: "Don't have",
    checking: "Checking",
    connectionDeclined: "Connection declined",
    copyLink: "Copy link",
    qrRenderFailed: "Unable to render QR code. Try again."
  },
  accountPanel: {
    title: "Connected",
    addressTitle: "Address",
    back: "Back",
    close: "Close",
    copy: "Copy address",
    copied: "Copied",
    disconnect: "Disconnect",
    explorer: "Explorer",
    showQr: "QR",
    lightQr: "Light QR",
    noTransactions: "Your activity will show up here.",
    recentTransactions: "Recent transactions",
    qrAlt: "TRON address QR"
  },
  activity: {
    title: "Activity",
    empty: "Your activity will show up here.",
    received: "Received",
    sent: "Sent",
    receivedToken: "Received {token}",
    sentToken: "Sent {token}",
    approve: "Approve {token}",
    staked: "Staked TRX",
    unstaked: "Unstaked TRX",
    delegated: "Delegated {resource}",
    undelegated: "Undelegated {resource}",
    voted: "Voted",
    claimedRewards: "Claimed rewards",
    contractCall: "Contract",
    unknown: "Transaction",
    from: "From {address}",
    to: "To {address}",
    energy: "Energy",
    bandwidth: "Bandwidth",
    votes: "{count} votes",
    pending: "Pending",
    failed: "Failed",
    confirmed: "Confirmed",
    view: "View"
  },
  walletButton: {
    connect: "Connect Wallet",
    connecting: "Connecting",
    openAccount: "Open account"
  },
  toast: {
    txSubmitted: "Transaction submitted",
    txConfirmed: "Transaction confirmed",
    txFailed: "Transaction failed",
    viewOnExplorer: "View",
    dismiss: "Dismiss notification"
  },
  errors: {
    fallbackTitle: "Request failed",
    fallbackMessage: "The wallet request failed. Try again.",
    codes: {
      WALLET_NOT_FOUND: {
        title: "Wallet not found",
        message: "This wallet is not registered in the current wallet kit configuration."
      },
      WALLET_UNAVAILABLE: {
        title: "Wallet unavailable",
        message: "This wallet is not available in the current browser."
      },
      CONNECTION_FAILED: {
        title: "Connection failed",
        message: "The wallet connection failed. Try again."
      },
      USER_REJECTED: {
        title: "Connection declined",
        message: "The request was cancelled in the wallet."
      },
      REQUEST_TIMEOUT: {
        title: "Request timed out",
        message: "The wallet did not respond in time. Try again."
      },
      CONFIGURATION_ERROR: {
        title: "Configuration error",
        message: "The wallet adapter could not be loaded. Refresh the page and try again."
      },
      NETWORK_ERROR: {
        title: "Network error",
        message: "The TRON network request failed. Check the RPC endpoint and try again."
      },
      RATE_LIMITED: {
        title: "Rate limited",
        message: "The TRON RPC endpoint is rate limiting requests. Try again shortly."
      },
      TRANSACTION_EXPIRATION_ERROR: {
        title: "Transaction expired",
        message: "The transaction expired before broadcast. Rebuild and sign it again."
      },
      OUT_OF_ENERGY: {
        title: "Not enough energy",
        message: "The account does not have enough TRON energy for this transaction."
      },
      INSUFFICIENT_BALANCE: {
        title: "Insufficient balance",
        message: "The account balance is not enough for this transaction."
      },
      SEND_TRANSACTION_FAILED: {
        title: "Transaction failed",
        message: "The transaction could not be broadcast to the TRON network."
      },
      SIGN_MESSAGE_FAILED: {
        title: "Signing failed",
        message: "The wallet could not sign the message."
      },
      SIGN_TRANSACTION_FAILED: {
        title: "Transaction signing failed",
        message: "The wallet could not sign the transaction."
      },
      UNSUPPORTED: {
        title: "Unsupported action",
        message: "This wallet does not support the requested action."
      },
      NO_SESSION: {
        title: "Wallet not connected",
        message: "Connect a TRON wallet before continuing."
      }
    }
  }
};
