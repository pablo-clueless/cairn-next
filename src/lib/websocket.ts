import { Socket, SocketOptions, io } from "socket.io-client";

export function createSocket(url: string, opts?: Partial<SocketOptions>): Socket {
  const socket = io(url, {
    transports: ["websocket"],
    ...opts,
  });

  return socket;
}
