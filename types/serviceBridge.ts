/**
 * types/serviceBridge.ts
 *
 * Canonical Service Bridge & Live Sync WebSocket message schemas and types.
 * Shared across uni-manager-api, uni-manager-ecclesia (Music Stand / LiveSync),
 * and live stage production engines.
 */

// ─── Roles ────────────────────────────────────────────────────────────────────

export type BridgeRole =
  | 'playback'
  | 'presentation'
  | 'monitor'
  | 'worship_leader'
  | 'broadcast'
  | 'music-stand'
  | 'church'
  | 'admin';

export type SyncTopic =
  | 'live_telemetry'
  | 'cue_advance'
  | 'service_plan'
  | 'notifications'
  | 'broadcast'
  | 'worship_leader'
  | 'dmx'
  | 'all';

// ─── Outbound & Shared Telemetry Messages ─────────────────────────────────────

export interface LiveTelemetryPayload {
  timestamp: number;
  bpm: number;
  timeSignature: string;
  position: number;
  isPlaying: boolean;
  activeSegmentId?: string;
  activeSectionLabel?: string;
  serviceId?: string;
  seq?: number;
}

export interface LiveTelemetryMessage {
  type: 'live_telemetry';
  payload: LiveTelemetryPayload;
}

export interface CueAdvancePayload {
  slideIndex?: number;
  itemId?: string;
  segmentId?: string;
  sectionLabel?: string;
  serviceId?: string;
  seq?: number;
  timestamp?: number;
}

export interface CueAdvanceMessage {
  type: 'cue_advance';
  payload: CueAdvancePayload;
  // Backward compatibility: allow top-level fields during migration
  segmentId?: string;
  sectionLabel?: string;
}

export interface SetlistPositionMessage {
  type: 'setlist_position';
  songIndex: number;
  songId?: string;
  total: number;
  segmentId?: string;
  serviceId?: string;
  seq?: number;
}

export interface ActiveSegmentMessage {
  type: 'active_segment';
  segmentId: string;
  serviceId?: string;
  seq?: number;
}

export interface ServicePlanItem {
  id: string;
  title: string;
  type: string;
  order: number;
}

export interface ServicePlanMessage {
  type: 'service_plan';
  payload: {
    serviceId: string;
    items: ServicePlanItem[];
  };
}

export interface ServiceStateSnapshotPayload {
  serviceId?: string;
  activeSegmentId?: string | null;
  activeSectionLabel?: string | null;
  cursorIdx?: number;
  isPlaying: boolean;
  bpm?: number | null;
  timeSignature?: string;
  seq: number;
  timestamp: number;
}

export interface ServiceStateSnapshotMessage {
  type: 'service_state';
  payload: ServiceStateSnapshotPayload;
}

export interface ConnectedMessage {
  type: 'connected';
  payload: {
    role: BridgeRole;
    connectedAt: string;
    subscriptions: SyncTopic[];
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    message: string;
  };
}

export interface PingMessage {
  type: 'ping';
  payload: {
    timestamp: number;
  };
}

export interface SubscribeMessage {
  type: 'subscribe';
  topics: SyncTopic[];
}

export interface UnsubscribeMessage {
  type: 'unsubscribe';
  topics: SyncTopic[];
}

export interface SubscribedAckMessage {
  type: 'subscribed';
  payload: {
    topics: SyncTopic[];
  };
}

export interface UnsubscribedAckMessage {
  type: 'unsubscribed';
  payload: {
    topics: SyncTopic[];
  };
}

// ─── Inbound Control & Stage Messages ─────────────────────────────────────────

export type CueAction = 'next' | 'prev' | 'jump' | 'ready';

export interface CueRequestMessage {
  type: 'cue_request';
  action: CueAction;
  segmentId?: string;
  songIndex?: number;
  serviceId?: string;
  clientRole: 'music-stand' | 'worship_leader';
  userId?: string;
  seq?: number;
  timestamp?: number;
}

export interface WLCueNextMessage {
  type: 'wl_cue_next';
  segmentId?: string;
  fromSongIndex?: number;
  serviceId?: string;
}

export interface WLCuePrevMessage {
  type: 'wl_cue_prev';
  segmentId?: string;
  fromSongIndex?: number;
  serviceId?: string;
}

export interface WLJumpToMessage {
  type: 'wl_jump_to';
  segmentId?: string;
  songIndex: number;
  serviceId?: string;
}

export interface WLReadyMessage {
  type: 'wl_ready';
  segmentId?: string;
  serviceId?: string;
}

export interface RequestCatchUpMessage {
  type: 'request_catch_up';
  serviceId?: string;
}

export interface SlideBroadcastMessage {
  type: 'slide_broadcast';
  payload: {
    timestamp: string;
    slideIndex: number;
    lowerThirdText: string;
    subText?: string;
    slideType:
      | 'lyric'
      | 'sermon'
      | 'announcement'
      | 'blank'
      | 'scripture'
      | 'other';
    isClear: boolean;
  };
}

export interface DmxSignalMessage {
  type: 'dmx_signal';
  payload: {
    sceneId: string;
    presetId: number;
    dmxUniverse: number;
  };
}

export type BridgeMessage =
  | LiveTelemetryMessage
  | CueAdvanceMessage
  | SetlistPositionMessage
  | ActiveSegmentMessage
  | ServicePlanMessage
  | ServiceStateSnapshotMessage
  | ConnectedMessage
  | ErrorMessage
  | PingMessage
  | SubscribeMessage
  | UnsubscribeMessage
  | SubscribedAckMessage
  | UnsubscribedAckMessage
  | CueRequestMessage
  | WLCueNextMessage
  | WLCuePrevMessage
  | WLJumpToMessage
  | WLReadyMessage
  | RequestCatchUpMessage
  | SlideBroadcastMessage
  | DmxSignalMessage;

// ─── Normalized Telemetry Event for Clients ───────────────────────────────────

export interface NormalizedBridgeEvent {
  type: string;
  serviceId?: string;
  activeSegmentId?: string | null;
  activeSectionLabel?: string | null;
  isPlaying?: boolean;
  bpm?: number | null;
  songIndex?: number;
  totalSongs?: number;
  seq?: number;
  raw: BridgeMessage | Record<string, unknown>;
}

/**
 * Parses and normalizes incoming bridge WebSocket messages safely,
 * accommodating canonical, payload-wrapped, and legacy formats.
 */
export function parseBridgeMessage(data: unknown): NormalizedBridgeEvent | null {
  if (!data || typeof data !== 'object') return null;
  const msg = data as Record<string, unknown>;
  const type = typeof msg.type === 'string' ? msg.type : '';
  if (!type) return null;

  const payload = (msg.payload && typeof msg.payload === 'object'
    ? msg.payload
    : {}) as Record<string, unknown>;

  const event: NormalizedBridgeEvent = {
    type,
    raw: msg as unknown as BridgeMessage
  };

  switch (type) {
    case 'cue_advance': {
      event.activeSegmentId =
        (typeof payload.segmentId === 'string' && payload.segmentId) ||
        (typeof payload.itemId === 'string' && payload.itemId) ||
        (typeof msg.segmentId === 'string' && msg.segmentId) ||
        null;
      event.activeSectionLabel =
        (typeof payload.sectionLabel === 'string' && payload.sectionLabel) ||
        (typeof msg.sectionLabel === 'string' && msg.sectionLabel) ||
        null;
      event.serviceId =
        (typeof payload.serviceId === 'string' && payload.serviceId) ||
        (typeof msg.serviceId === 'string' && msg.serviceId) ||
        undefined;
      if (typeof payload.seq === 'number') event.seq = payload.seq;
      break;
    }

    case 'setlist_position': {
      event.activeSegmentId =
        (typeof msg.segmentId === 'string' && msg.segmentId) ||
        (typeof msg.songId === 'string' && msg.songId) ||
        null;
      if (typeof msg.songIndex === 'number') event.songIndex = msg.songIndex;
      if (typeof msg.total === 'number') event.totalSongs = msg.total;
      if (typeof msg.serviceId === 'string') event.serviceId = msg.serviceId;
      if (typeof msg.seq === 'number') event.seq = msg.seq;
      break;
    }

    case 'active_segment': {
      event.activeSegmentId =
        typeof msg.segmentId === 'string' ? msg.segmentId : null;
      if (typeof msg.serviceId === 'string') event.serviceId = msg.serviceId;
      if (typeof msg.seq === 'number') event.seq = msg.seq;
      break;
    }

    case 'live_telemetry': {
      const transport = (msg.transport && typeof msg.transport === 'object'
        ? msg.transport
        : payload) as Record<string, unknown>;
      if (typeof transport.isPlaying === 'boolean') {
        event.isPlaying = transport.isPlaying;
      }
      if (typeof transport.bpm === 'number') {
        event.bpm = transport.bpm;
      }
      if (typeof transport.activeSegmentId === 'string') {
        event.activeSegmentId = transport.activeSegmentId;
      }
      if (typeof transport.activeSectionLabel === 'string') {
        event.activeSectionLabel = transport.activeSectionLabel;
      }
      if (typeof transport.serviceId === 'string') {
        event.serviceId = transport.serviceId;
      }
      if (typeof transport.seq === 'number') event.seq = transport.seq;
      break;
    }

    case 'service_state': {
      if (typeof payload.activeSegmentId !== 'undefined') {
        event.activeSegmentId = payload.activeSegmentId as string | null;
      }
      if (typeof payload.activeSectionLabel !== 'undefined') {
        event.activeSectionLabel = payload.activeSectionLabel as string | null;
      }
      if (typeof payload.isPlaying === 'boolean') {
        event.isPlaying = payload.isPlaying;
      }
      if (typeof payload.bpm === 'number') {
        event.bpm = payload.bpm;
      }
      if (typeof payload.serviceId === 'string') {
        event.serviceId = payload.serviceId;
      }
      if (typeof payload.seq === 'number') event.seq = payload.seq;
      break;
    }

    default:
      break;
  }

  return event;
}
