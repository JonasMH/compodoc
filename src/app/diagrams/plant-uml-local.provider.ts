import { IPlantUmlProvider } from './plant-uml-provider.interface';
import * as fs from 'fs-extra';
import { PlantUmlExecutor } from './plant-uml-executor';
import { Stream } from 'stream';
import { ConfigurationInterface } from '../interfaces/configuration.interface';

export class PlantUmlLocalProvider implements IPlantUmlProvider {
    constructor(private configuration: ConfigurationInterface) {

    }

    public getDiagram(file: string): Promise<Buffer> {
        const executer = new PlantUmlExecutor();
        const options = ['-pipe'];
        const configLocation = this.configuration.mainData.diagramOptions.configLocation;

        if(configLocation) {
            options.push('-config');
            options.push(configLocation);
        }

        const child = executer.exec(this.configuration.mainData.diagramOptions.jarLocation, options);
        const rs = fs.createReadStream(file);

        rs.pipe(child.stdin);

        return new Promise((resolve, reject) => {
            let stream = new Stream.Transform();

            child.stdout.on('data', (chunk) => stream.push(chunk));
            child.stdout.on('end', () => resolve(stream.read()));
            child.stdout.on('error', (err) => reject(err));
        });
    }
}