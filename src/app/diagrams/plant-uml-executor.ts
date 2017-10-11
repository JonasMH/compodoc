import * as childProcess from 'child_process';

let path = require('path');

export class PlantUmlExecutor {
    public exec(jarLocation: string, argv: Array<string>): childProcess.ChildProcess {
        let opts = [
            '-Dplantuml.include.path=' + process.cwd(),
            '-Djava.awt.headless=true',
            '-jar', path.join(__dirname, jarLocation)
        ].concat(argv);

        return childProcess.spawn('java', opts);
    }
}