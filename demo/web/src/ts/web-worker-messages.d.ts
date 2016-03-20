import * as gw from "gif-writer";

export interface MyWorkerRequestMessageData {
    imageDataList: gw.IImageData[];
    imageSize: number;
    paletteSize: number;
    delayTimeInMS: number;
}

export interface MyWorkerRequestMessageEvent extends MessageEvent {
    data: MyWorkerRequestMessageData;
}

export interface MyWorkerResponseMessageData {
    gifDataStr: string;
}

export interface MyWorkerResponseMessageEvent extends MessageEvent {
    data: MyWorkerResponseMessageData;
}

export interface MyWorker extends Worker {
    onmessage: (ev: MyWorkerResponseMessageEvent) => any;
    postMessage(message: MyWorkerRequestMessageData, ports?: any): void;
}
