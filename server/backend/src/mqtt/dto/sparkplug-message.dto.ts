export interface SparkplugMetric {
  name: string;
  alias?: number;
  timestamp: number;
  dataType: string;
  value: any;
  properties?: Record<string, any>;
}

export interface SparkplugMessage {
  timestamp: number;
  metrics: SparkplugMetric[];
  seq: number;
}

export enum SparkplugMessageType {
  NBIRTH = 'NBIRTH',
  NDEATH = 'NDEATH',
  DBIRTH = 'DBIRTH',
  DDEATH = 'DDEATH',
  NDATA = 'NDATA',
  DDATA = 'DDATA',
  NCMD = 'NCMD',
  DCMD = 'DCMD',
}

export interface ParsedTopic {
  namespace: string;
  groupId: string;
  messageType: SparkplugMessageType;
  edgeNodeId: string;
  deviceId?: string;
}
