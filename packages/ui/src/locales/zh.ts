import type { WalletKitLabelPack } from "../types";

export const zh: WalletKitLabelPack = {
  connectModal: {
    title: "连接钱包",
    subtitle: "",
    allWallets: "全部钱包",
    back: "返回",
    close: "关闭",
    connecting: "连接中",
    continueInWallet: "继续使用",
    acceptRequest: "请在钱包中确认连接请求",
    tryAgain: "重试",
    getWallet: "获取",
    searchWallet: "搜索钱包",
    searchPlaceholder: "搜索钱包",
    noWalletsFound: "未找到 TRON 钱包",
    poweredBy: "由 TRON Wallet Kit 提供支持",
    unavailable: "不可用",
    ready: "就绪",
    installed: "已安装",
    notInstalled: "未安装",
    qrCode: "二维码",
    tron: "TRON",
    scanQr: "使用手机扫描此二维码",
    dontHave: "还没有",
    checking: "检测中",
    connectionDeclined: "连接被拒绝",
    copyLink: "复制链接",
    qrRenderFailed: "无法生成二维码，请重试。"
  },
  accountPanel: {
    title: "已连接",
    addressTitle: "地址",
    back: "返回",
    close: "关闭",
    copy: "复制地址",
    copied: "已复制",
    disconnect: "断开连接",
    explorer: "区块浏览器",
    showQr: "二维码",
    lightQr: "浅色二维码",
    noTransactions: "暂无近期交易",
    recentTransactions: "近期交易",
    qrAlt: "TRON 地址二维码",
    gasFree: "GasFree",
    gasFreeTitle: "GasFree",
    gasFreeDescription: "Send USDT without TRX for gas.",
    gasFreeAddress: "GasFree address",
    gasFreeBalance: "USDT balance",
    gasFreeBalanceLoading: "Loading USDT balance",
    gasFreeUnavailable: "GasFree is not available for this account.",
    backToGeneral: "Use General Wallet"
  },
  activity: {
    title: "活动记录",
    empty: "暂无活动",
    received: "收款",
    sent: "转账",
    receivedToken: "收到 {token}",
    sentToken: "发送 {token}",
    approve: "授权 {token}",
    staked: "质押 TRX",
    unstaked: "解除质押 TRX",
    delegated: "代理 {resource}",
    undelegated: "取消代理 {resource}",
    voted: "投票",
    claimedRewards: "领取奖励",
    contractCall: "合约调用",
    unknown: "交易",
    from: "来自 {address}",
    to: "发送至 {address}",
    energy: "能量",
    bandwidth: "带宽",
    votes: "{count} 票",
    pending: "待确认",
    failed: "失败",
    confirmed: "已确认",
    view: "查看"
  },
  walletButton: {
    connect: "连接钱包",
    connecting: "连接中",
    openAccount: "打开账户"
  },
  toast: {
    txSubmitted: "交易已提交",
    txConfirmed: "交易已确认",
    txFailed: "交易失败",
    viewOnExplorer: "查看",
    dismiss: "关闭"
  },
  errors: {
    fallbackTitle: "请求失败",
    fallbackMessage: "钱包请求失败，请重试。",
    codes: {
      WALLET_NOT_FOUND: {
        title: "未找到钱包",
        message: "该钱包未在当前钱包套件配置中注册。"
      },
      WALLET_UNAVAILABLE: {
        title: "钱包不可用",
        message: "该钱包在当前浏览器中不可用。"
      },
      CONNECTION_FAILED: {
        title: "连接失败",
        message: "钱包连接失败，请重试。"
      },
      USER_REJECTED: {
        title: "连接被拒绝",
        message: "请求已在钱包中取消。"
      },
      REQUEST_TIMEOUT: {
        title: "请求超时",
        message: "钱包未在规定时间内响应，请重试。"
      },
      CONFIGURATION_ERROR: {
        title: "配置错误",
        message: "无法加载钱包适配器。请刷新页面后重试。"
      },
      NETWORK_ERROR: {
        title: "网络错误",
        message: "TRON 网络请求失败。请检查 RPC 节点后重试。"
      },
      RATE_LIMITED: {
        title: "请求受限",
        message: "TRON RPC 节点正在限流，请稍后重试。"
      },
      TRANSACTION_EXPIRATION_ERROR: {
        title: "交易已过期",
        message: "交易在广播前已过期。请重新构建并签名。"
      },
      OUT_OF_ENERGY: {
        title: "能量不足",
        message: "账户没有足够的 TRON 能量来完成此交易。"
      },
      INSUFFICIENT_BALANCE: {
        title: "余额不足",
        message: "账户余额不足以完成此交易。"
      },
      SEND_TRANSACTION_FAILED: {
        title: "交易失败",
        message: "交易无法广播到 TRON 网络。"
      },
      SIGN_MESSAGE_FAILED: {
        title: "签名失败",
        message: "钱包无法对该消息进行签名。"
      },
      SIGN_TRANSACTION_FAILED: {
        title: "交易签名失败",
        message: "钱包无法对该交易进行签名。"
      },
      UNSUPPORTED: {
        title: "不支持的操作",
        message: "该钱包不支持所请求的操作。"
      },
      NO_SESSION: {
        title: "钱包未连接",
        message: "请先连接 TRON 钱包再继续。"
      }
    }
  }
};
