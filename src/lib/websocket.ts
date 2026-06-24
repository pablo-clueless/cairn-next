import { type ManagerOptions, type Socket, type SocketOptions, io } from "socket.io-client";

/**
 * A map of `event name -> payload type`. Define one per feature (or one global
 * map) to get fully typed pub/sub — the utilities below are agnostic to the
 * shape of your events, they just enforce whatever map you hand them.
 *
 * @example
 * type IssueEvents = {
 *   "issue.created": { id: string; key: string };
 *   "issue.moved": { id: string; status_id: string; rank: number };
 * };
 */
export type EventMap = Record<string, unknown>;

/** A handler invoked with the payload of a single event. */
export type EventHandler<T> = (payload: T) => void;

/** Tears down a previously registered subscription. */
export type Unsubscribe = () => void;

/** Connection lifecycle states surfaced by {@link WebsocketClient}. */
export type ConnectionState = "connecting" | "connected" | "disconnected";

export type SocketConfig = Partial<ManagerOptions & SocketOptions>;

/**
 * Create a raw socket.io socket with websocket-first transport. Prefer
 * {@link WebsocketClient} for app code; reach for this only when you need the
 * underlying socket directly.
 */
export function createSocket(url: string, opts?: SocketConfig): Socket {
  return io(url, {
    transports: ["websocket"],
    autoConnect: false,
    ...opts,
  });
}

/** Resolve the socket URL from config or the public env var, or throw. */
function resolveUrl(url?: string): string {
  const resolved = url ?? process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!resolved) {
    throw new Error("WebsocketClient: no url provided and NEXT_PUBLIC_SOCKET_URL is unset");
  }
  return resolved;
}

/**
 * A thin, fully typed wrapper over a socket.io socket.
 *
 * Generic over an `Incoming` event map (events you `subscribe` to) and an
 * `Outgoing` event map (events you `publish`); both default to a free-form
 * {@link EventMap} so the client is usable without any types and precise once
 * you supply them. Every `subscribe`/`once` returns an {@link Unsubscribe} so
 * callers (React effects, etc.) never leak listeners.
 *
 * @example
 * const ws = new WebsocketClient<IssueEvents>();
 * ws.connect();
 * const off = ws.subscribe("issue.moved", ({ id, rank }) => { ... });
 * // later
 * off();
 * ws.disconnect();
 */
export class WebsocketClient<
  Incoming extends EventMap = EventMap,
  Outgoing extends EventMap = Incoming,
> {
  private readonly socket: Socket;

  constructor(url?: string, opts?: SocketConfig) {
    this.socket = createSocket(resolveUrl(url), opts);
  }

  /** Open the connection (no-op if already connected). Chainable. */
  connect(): this {
    if (!this.socket.connected) this.socket.connect();
    return this;
  }

  /** Close the connection. Chainable. */
  disconnect(): this {
    this.socket.disconnect();
    return this;
  }

  get connected(): boolean {
    return this.socket.connected;
  }

  get state(): ConnectionState {
    if (this.socket.connected) return "connected";
    return this.socket.active ? "connecting" : "disconnected";
  }

  /** Escape hatch for code that needs the raw socket.io instance. */
  get raw(): Socket {
    return this.socket;
  }

  /**
   * The socket viewed as an untyped event bus. socket.io's typed `on`/`emit`
   * model events as variadic listeners with a reserved-event union, which
   * fights our single-payload, map-driven contract — so we enforce the types at
   * the public method boundary and treat the underlying socket as `unknown`.
   */
  private get bus(): RawBus {
    return this.socket as unknown as RawBus;
  }

  /** Emit an event with its typed payload. Chainable. */
  publish<E extends keyof Outgoing & string>(event: E, payload: Outgoing[E]): this {
    this.bus.emit(event, payload);
    return this;
  }

  /** Listen for an event; returns an unsubscribe fn. */
  subscribe<E extends keyof Incoming & string>(
    event: E,
    handler: EventHandler<Incoming[E]>,
  ): Unsubscribe {
    return this.listen(event, handler as RawHandler, false);
  }

  /** Like {@link subscribe} but fires at most once; returns an unsubscribe fn. */
  once<E extends keyof Incoming & string>(
    event: E,
    handler: EventHandler<Incoming[E]>,
  ): Unsubscribe {
    return this.listen(event, handler as RawHandler, true);
  }

  /** Register a connection-lifecycle listener; returns an unsubscribe fn. */
  on(event: "connect" | "disconnect", handler: () => void): Unsubscribe;
  on(event: "connect_error", handler: (error: Error) => void): Unsubscribe;
  on(event: string, handler: (...args: never[]) => void): Unsubscribe {
    return this.listen(event, handler as RawHandler, false);
  }

  private listen(event: string, handler: RawHandler, once: boolean): Unsubscribe {
    if (once) this.bus.once(event, handler);
    else this.bus.on(event, handler);
    return () => {
      this.bus.off(event, handler);
    };
  }
}

type RawHandler = (...args: unknown[]) => void;

/** Minimal untyped view of a socket.io socket used internally by {@link WebsocketClient}. */
interface RawBus {
  on(event: string, handler: RawHandler): void;
  once(event: string, handler: RawHandler): void;
  off(event: string, handler: RawHandler): void;
  emit(event: string, ...args: unknown[]): void;
}
