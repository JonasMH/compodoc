// tslint:disable:no-bitwise
import * as http from 'http';
import { unescape } from 'querystring';
import { deflate } from './deflate';
import { IPlantUmlProvider } from './plant-uml-provider.interface';
import * as fs from 'fs-extra';

const Stream = require('stream').Transform;

export class PlantUmlWebProvider implements IPlantUmlProvider {
    public getDiagram(file: string): Promise<Buffer> {
        let uml = fs.readFileSync(file).toString();
        uml = unescape(encodeURIComponent(uml));

        const encodedUml = this.encode64(deflate(uml,9));

        const requestUrl = 'http://www.plantuml.com/plantuml/img/' + encodedUml;

        return new Promise((resolve, reject) => {
            let stream = new Stream();
            http.get(requestUrl, response => {
                response.on('data', (chunk) => {
                    stream.push(chunk);
                });

                response.on('end', () => resolve(stream.read()));
            }).on('error', error => {
                reject(error);
            });
        });
    }

    private encode6bit(b) {
        if (b < 10) {
            return String.fromCharCode(48 + b);
        }
        b -= 10;
        if (b < 26) {
            return String.fromCharCode(65 + b);
        }
        b -= 26;
        if (b < 26) {
            return String.fromCharCode(97 + b);
        }
        b -= 26;
        if (b === 0) {
            return '-';
        }
        if (b === 1) {
            return '_';
        }
        return '?';
    }

    private append3bytes(b1, b2, b3) {
        let c1 = b1 >> 2;
        let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
        let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
        let c4 = b3 & 0x3F;
        let r = '';
        r += this.encode6bit(c1 & 0x3F);
        r += this.encode6bit(c2 & 0x3F);
        r += this.encode6bit(c3 & 0x3F);
        r += this.encode6bit(c4 & 0x3F);
        return r;
    }

    private encode64(data: string): string {
        let r = '';
        for (let i = 0; i < data.length; i += 3) {
            if (i + 2 === data.length) {
                r += this.append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
            } else if (i + 1 === data.length) {
                r += this.append3bytes(data.charCodeAt(i), 0, 0);
            } else {
                r += this.append3bytes(data.charCodeAt(i),
                    data.charCodeAt(i + 1),
                    data.charCodeAt(i + 2));
            }
        }
        return r;
    }
}