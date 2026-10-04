import * as signalR from '@microsoft/signalr';
import { ApiConfig } from '../../../core/network/apiConfig';
import { StorageService } from '../../../core/services/storageService';

export class SupportHubService {
  private hubConnection: signalR.HubConnection | null = null;
  private onMessageReceivedCallback: ((playerId: string, message: any) => void) | null = null;

  public async connect(): Promise<void> {
    const token = StorageService.getToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${ApiConfig.baseUrl}/hubs/support?access_token=${token}`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveMessage', (playerId: string, message: any) => {
      if (this.onMessageReceivedCallback) {
        this.onMessageReceivedCallback(playerId, message);
      }
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('Error connecting to SignalR: ', err);
    }
  }

  public onMessageReceived(callback: (playerId: string, message: any) => void) {
    this.onMessageReceivedCallback = callback;
  }

  public async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }
}

export const supportHubService = new SupportHubService();
