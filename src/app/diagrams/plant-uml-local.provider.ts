import { IPlantUmlProvider } from './plant-uml-provider.interface';
import * as fs from 'fs-extra';
import { PlantUmlExecutor } from './plant-uml-executor';
import { Stream } from 'stream';

export class PlantUmlLocalProvider implements IPlantUmlProvider {

    public getDiagram(file: string): Promise<Buffer> {
        const executer = new PlantUmlExecutor();

        const child = executer.exec(['-pipe', '-Smonochrome=true'], undefined, undefined);
        const rs = fs.createReadStream(file);

        rs.pipe(child.stdin);


        return new Promise((resolve, reject) => {
            let stream = new Stream.Transform();

            child.stdout.on('data', (chunk) => {
                stream.push(chunk);
            });

            child.stdout.on('end', () => resolve(stream.read()));
            child.stdout.on('error', (err) => reject(err));
        });
    }
}