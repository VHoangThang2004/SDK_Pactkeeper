import * as signalR from '@microsoft/signalr';
import { ApiConfig } from '../../../core/network/apiConfig';
import { StorageService } from '../../../core/services/storageService';

export interface SupportMessageDto {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  attachmentUrl: string;
  createdAt: string;
}

type MessageHandler = (playerId: string, message: SupportMessageDto) => void;
type GenericEventHandler = (...args: any[]) => void;
type ConnectionStateListener = (connected: boolean) => void;
type ReconnectedListener = () => void;

export class SupportHubService {
  private hubConnection: signalR.HubConnection | null = null;
  private messageListeners = new Set<MessageHandler>();
  private genericListeners = new Map<string, Set<GenericEventHandler>>();
  private connectionListeners = new Set<ConnectionStateListener>();
  private reconnectedListeners = new Set<ReconnectedListener>();
  private connectPromise: Promise<void> | null = null;

  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  public async connect(): Promise<void> {
    const token = StorageService.getToken();
    if (!token) return;

    // If already connected, do nothing
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    // If currently connecting, return existing promise
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      try {
        if (!this.hubConnection) {
          this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${ApiConfig.baseUrl}/hubs/support`, {
              accessTokenFactory: () => StorageService.getToken() || '',
            })
            .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000])
            .build();

          // Standard ReceiveMessage event from backend
          this.hubConnection.on('ReceiveMessage', (playerId: string, message: any) => {
            this.messageListeners.forEach((fn) => {
              try {
                fn(playerId, message);
              } catch (e) {
                console.error('[SignalR] Error in message listener:', e);
              }
            });
          });

          // Forward all named events to registered generic listeners
          const listenEvents = ['ReceiveProfileUpdate', 'ReceiveNotification'];
          listenEvents.forEach((eventName) => {
            this.hubConnection?.on(eventName, (...args: any[]) => {
              const listeners = this.genericListeners.get(eventName);
              if (listeners) {
                listeners.forEach((fn) => {
                  try {
                    fn(...args);
                  } catch (e) {
                    console.error(`[SignalR] Error in ${eventName} listener:`, e);
                  }
                });
              }
            });
          });

          this.hubConnection.onreconnecting((error) => {
            console.warn('[SignalR SupportHub] Reconnecting due to error:', error);
            this.notifyConnectionChange(false);
          });

          this.hubConnection.onreconnected((connectionId) => {
            console.log('[SignalR SupportHub] Reconnected successfully. New connectionId:', connectionId);
            this.notifyConnectionChange(true);
            this.reconnectedListeners.forEach((fn) => {
              try {
                fn();
              } catch (e) {
                console.error('[SignalR] Error in reconnected listener:', e);
              }
            });
          });

          this.hubConnection.onclose((error) => {
            console.warn('[SignalR SupportHub] Connection closed:', error);
            this.notifyConnectionChange(false);
          });
        }

        if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
          await this.hubConnection.start();
          console.log('[SignalR SupportHub] Connected successfully.');
          this.notifyConnectionChange(true);
        }
      } catch (err) {
        console.warn('[SignalR SupportHub] Connect error (REST polling fallback active):', err);
        this.notifyConnectionChange(false);
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionListeners.forEach((fn) => {
      try {
        fn(connected);
      } catch (e) {
        console.error('[SignalR] Error in connection listener:', e);
      }
    });
  }

  /**
   * Subscribe to incoming chat messages.
   * Returns an unsubscribe function.
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => {
      this.messageListeners.delete(handler);
    };
  }

  /**
   * Legacy method for backwards compatibility with existing callers.
   */
  public onMessageReceived(callback: MessageHandler) {
    this.messageListeners.clear();
    this.messageListeners.add(callback);
  }

  /**
   * Subscribe to specific SignalR events (e.g. 'ReceiveNotification', 'ReceiveProfileUpdate').
   * Returns an unsubscribe function.
   */
  public onEvent(eventName: string, handler: GenericEventHandler): () => void {
    if (!this.genericListeners.has(eventName)) {
      this.genericListeners.set(eventName, new Set());
      // Register with hubConnection if already built
      this.hubConnection?.on(eventName, (...args: any[]) => {
        const listeners = this.genericListeners.get(eventName);
        listeners?.forEach((fn) => {
          try {
            fn(...args);
          } catch (e) {
            console.error(`[SignalR] Error in ${eventName} listener:`, e);
          }
        });
      });
    }

    this.genericListeners.get(eventName)?.add(handler);
    return () => {
      this.genericListeners.get(eventName)?.delete(handler);
    };
  }

  /**
   * Fires whenever connection re-establishes after a drop.
   * Useful for triggering data refetch to guarantee zero lost messages.
   */
  public onReconnected(handler: ReconnectedListener): () => void {
    this.reconnectedListeners.add(handler);
    return () => {
      this.reconnectedListeners.delete(handler);
    };
  }

  /**
   * Listen for online / offline real-time status.
   */
  public onConnectionChange(handler: ConnectionStateListener): () => void {
    this.connectionListeners.add(handler);
    // Fire immediately with current state
    handler(this.isConnected());
    return () => {
      this.connectionListeners.delete(handler);
    };
  }

  public async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch {
        // ignore
      }
      this.hubConnection = null;
      this.notifyConnectionChange(false);
    }
  }
}

export const supportHubService = new SupportHubService();
