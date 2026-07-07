import type {
  ConnectOptions,
  ConnectResult,
  SignMessageRequest,
  SignMessageResult,
  SignTransactionRequest,
  SignTransactionResult,
  SubmitTransactionRequest,
  TxResult,
  WalletAdapter,
  WalletCapabilities,
  WalletMetadata,
  WalletSession
} from "./types";

export abstract class BaseWalletAdapter implements WalletAdapter {
  adapterApiVersion = "1.1";
  abstract metadata: WalletMetadata;
  abstract capabilities: WalletCapabilities;
  abstract connect(options: ConnectOptions): Promise<ConnectResult>;
  disconnect?(): Promise<void>;
  isAvailable?(): boolean | Promise<boolean>;
  restoreSession?(session: WalletSession): Promise<ConnectResult | null>;
  canRecoverSession?(options: ConnectOptions): boolean | Promise<boolean>;
  recoverSession?(options: ConnectOptions): Promise<ConnectResult | null>;
  cancelPendingConnection?(): void | Promise<void>;
  signMessage?(request: SignMessageRequest): Promise<SignMessageResult>;
  signTransaction?(request: SignTransactionRequest): Promise<SignTransactionResult>;
  submitTransaction?(request: SubmitTransactionRequest): Promise<TxResult>;
}
