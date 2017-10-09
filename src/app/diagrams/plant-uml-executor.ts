'use strict';

import * as childProcess from 'child_process';

let path = require('path');

let INCLUDED_PLANTUML_JAR = path.join(__dirname, './plantuml.jar');
let PLANTUML_JAR = process.env.PLANTUML_HOME || INCLUDED_PLANTUML_JAR;

export class PlantUmlExecutor {
    public exec(argv: Array<string>, cwd, callback): childProcess.ChildProcess {
        cwd = cwd || process.cwd();
        let opts = [
            '-Dplantuml.include.path=' + cwd,
            '-Djava.awt.headless=true',
            '-jar', PLANTUML_JAR
        ].concat(argv);

        return childProcess.spawn('java', opts);
    }
}