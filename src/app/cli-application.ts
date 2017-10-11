import * as fs from 'fs-extra';
import * as path from 'path';

import { Application } from './application';
import { COMPODOC_DEFAULTS } from '../utils/defaults';
import { logger } from '../logger';
import { ExcludeParser } from '../utils/exclude.parser';
import { handlePath, readConfig } from '../utils/utils';

const osName = require('os-name');
const commander = require('commander');
const os = require('os');

declare var PACKAGE_NAME: string;
declare var PACKAGE_VERSION: string;

export class CliApplication extends Application {

    constructor() {
        super();
    }

    /**
     * Run compodoc from the command line.
     */
    public generate() {
        let cwd = process.cwd();
        let files = [];

        function list(val) {
            return val.split(',');
        }

        // tslint:disable:max-line-length
        commander
            .version(PACKAGE_VERSION)
            .usage('<src> [options]')
            .option('-p, --tsconfig [config]', 'A tsconfig.json file')
            .option('-d, --output [folder]', 'Where to store the generated documentation (default: ./documentation)', COMPODOC_DEFAULTS.folder)
            .option('-y, --extTheme [file]', 'External styling theme file')
            .option('-n, --name [name]', 'Title documentation', COMPODOC_DEFAULTS.title)
            .option('-a, --assetsFolder [folder]', 'External assets folder to copy in generated documentation folder')
            .option('-o, --open', 'Open the generated documentation', false)
            .option('-t, --silent', 'In silent mode, log messages aren\'t logged in the console', false)
            .option('-s, --serve', 'Serve generated documentation (default http://localhost:8080/)', false)
            .option('-r, --port [port]', 'Change default serving port', COMPODOC_DEFAULTS.port)
            .option('-w, --watch', 'Watch source files after serve and force documentation rebuild', false)
            .option('--theme [theme]','Choose one of available themes, default is \'gitbook\' (laravel, original, postmark, readthedocs, stripe, vagrant)')
            .option('--hideGenerator', 'Do not print the Compodoc link at the bottom of the page', false)
            .option('--toggleMenuItems <items>', 'Close by default items in the menu (default [\'all\']) values : [\'all\'] or one of these [\'modules\',\'components\',\'directives\',\'classes\',\'injectables\',\'interfaces\',\'pipes\',\'additionalPages\']', list, COMPODOC_DEFAULTS.toggleMenuItems)
            .option('--includes [path]', 'Path of external markdown files to include')
            .option('--includesName [name]', 'Name of item menu of externals markdown files (default "Additional documentation")', COMPODOC_DEFAULTS.additionalEntryName)
            .option('--coverageTest [threshold]', 'Test command of documentation coverage with a threshold (default 70)')
            .option('--coverageMinimumPerFile [minimum]', 'Test command of documentation coverage per file with a minimum (default 0)')
            .option('--disableSourceCode', 'Do not add source code tab and links to source code', false)
            .option('--disableGraph', 'Do not add the dependency graph', false)
            .option('--disableCoverage', 'Do not add the documentation coverage report', false)
            .option('--disablePrivateOrInternalSupport', 'Do not show private, @internal or Angular lifecycle hooks in generated documentation', false)
            .option('--plantUmlJarLocation [path]', 'Enables diagram generation using plantuml (beta)')
            .option('--plantUmlConfig [path]', 'PlantUML Configuration (beta)')
            .parse(process.argv);
        // tslint:enable:max-line-length

        let outputHelp = () => {
            commander.outputHelp();
            process.exit(1);
        };

        if (commander.output) {
            this.configuration.mainData.output = commander.output;
        }

        if (commander.extTheme) {
            this.configuration.mainData.extTheme = commander.extTheme;
        }

        if (commander.theme) {
            this.configuration.mainData.theme = commander.theme;
        }

        if (commander.name) {
            this.configuration.mainData.documentationMainName = commander.name;
        }

        if (commander.assetsFolder) {
            this.configuration.mainData.assetsFolder = commander.assetsFolder;
        }

        if (commander.open) {
            this.configuration.mainData.open = commander.open;
        }

        if (commander.toggleMenuItems) {
            this.configuration.mainData.toggleMenuItems = commander.toggleMenuItems;
        }

        if (commander.includes) {
            this.configuration.mainData.includes = commander.includes;
        }

        if (commander.includesName) {
            this.configuration.mainData.includesName = commander.includesName;
        }

        if (commander.silent) {
            logger.silent = false;
        }

        if (commander.serve) {
            this.configuration.mainData.serve = commander.serve;
        }

        if (commander.port) {
            this.configuration.mainData.port = commander.port;
        }

        if (commander.watch) {
            this.configuration.mainData.watch = commander.watch;
        }

        if (commander.hideGenerator) {
            this.configuration.mainData.hideGenerator = commander.hideGenerator;
        }

        if (commander.includes) {
            this.configuration.mainData.includes = commander.includes;
        }

        if (commander.includesName) {
            this.configuration.mainData.includesName = commander.includesName;
        }

        if (commander.coverageTest) {
            this.configuration.mainData.coverageTest = true;
            this.configuration.mainData.coverageTestThreshold =
                (typeof commander.coverageTest === 'string') ?
                    parseInt(commander.coverageTest, 10) :
                    COMPODOC_DEFAULTS.defaultCoverageThreshold;
        }

        if (commander.coverageMinimumPerFile) {
            this.configuration.mainData.coverageTestPerFile = true;
            this.configuration.mainData.coverageMinimumPerFile =
                (typeof commander.coverageMinimumPerFile === 'string') ?
                    parseInt(commander.coverageMinimumPerFile, 10) :
                    COMPODOC_DEFAULTS.defaultCoverageMinimumPerFile;
        }

        if (commander.disableSourceCode) {
            this.configuration.mainData.disableSourceCode = commander.disableSourceCode;
        }

        if (commander.disableGraph) {
            this.configuration.mainData.disableGraph = commander.disableGraph;
        }

        if (commander.disableCoverage) {
            this.configuration.mainData.disableCoverage = commander.disableCoverage;
        }

        if (commander.disablePrivateOrInternalSupport) {
            this.configuration.mainData.disablePrivateOrInternalSupport = commander.disablePrivateOrInternalSupport;
        }

        if (commander.plantUmlJarLocation) {
            let diagramOptions: any = {
                enabled: true,
                jarLocation: commander.plantUmlJarLocation
            };

            if (commander.plantUmlConfig) {
                diagramOptions.configLocation = commander.plantUmlConfig;
            }

            this.configuration.mainData.diagramOptions = diagramOptions;
        }

        if (!this.isWatching) {
            console.log(fs.readFileSync(path.join(__dirname, '../src/banner')).toString());
            console.log(PACKAGE_VERSION);
            console.log('');
            console.log(`Node.js version : ${process.version}`);
            console.log('');
            console.log(`Operating system : ${osName(os.platform(), os.release())}`);
            console.log('');
        }

        if (commander.serve && !commander.tsconfig && commander.output) {
            // if -s & -d, serve it
            if (!fs.existsSync(commander.output)) {
                logger.error(`${commander.output} folder doesn't exist`);
                process.exit(1);
            } else {
                logger.info(`Serving documentation from ${commander.output} at http://127.0.0.1:${commander.port}`);
                super.runWebServer(commander.output);
            }
        } else if (commander.serve && !commander.tsconfig && !commander.output) {
            // if only -s find ./documentation, if ok serve, else error provide -d
            if (!fs.existsSync(commander.output)) {
                logger.error('Provide output generated folder with -d flag');
                process.exit(1);
            } else {
                logger.info(`Serving documentation from ${commander.output} at http://127.0.0.1:${commander.port}`);
                super.runWebServer(commander.output);
            }
        } else {
            if (commander.hideGenerator) {
                this.configuration.mainData.hideGenerator = true;
            }

            if (commander.tsconfig && commander.args.length === 0) {
                this.configuration.mainData.tsconfig = commander.tsconfig;
                if (!fs.existsSync(commander.tsconfig)) {
                    logger.error(`"${commander.tsconfig}" file was not found in the current directory`);
                    process.exit(1);
                } else {
                    let _file = path.join(
                        path.join(process.cwd(), path.dirname(this.configuration.mainData.tsconfig)),
                        path.basename(this.configuration.mainData.tsconfig)
                    );
                    // use the current directory of tsconfig.json as a working directory
                    cwd = _file.split(path.sep).slice(0, -1).join(path.sep);
                    logger.info('Using tsconfig', _file);

                    let tsConfigFile = readConfig(_file);
                    files = tsConfigFile.files;
                    if (files) {
                        files = handlePath(files, cwd);
                    }

                    if (!files) {
                        let exclude = tsConfigFile.exclude || [];
                        files = [];

                        ExcludeParser.init(exclude, cwd);

                        let finder = require('findit')(cwd || '.');

                        finder.on('directory', function (dir, stat, stop) {
                            let base = path.basename(dir);
                            if (base === '.git' || base === 'node_modules') {
                                stop();
                            }
                        });

                        finder.on('file', (file, stat) => {
                            if (/(spec|\.d)\.ts/.test(file)) {
                                logger.warn('Ignoring', file);
                            } else if (ExcludeParser.testFile(file)) {
                                logger.warn('Excluding', file);
                            } else if (path.extname(file) === '.ts') {
                                logger.debug('Including', file);
                                files.push(file);
                            }
                        });

                        finder.on('end', () => {
                            super.setFiles(files);
                            super.generate();
                        });
                    } else {
                        super.setFiles(files);
                        super.generate();
                    }
                }
            } else if (commander.tsconfig && commander.args.length > 0 && commander.coverageTest) {
                logger.info('Run documentation coverage test');
                this.configuration.mainData.tsconfig = commander.tsconfig;
                if (!fs.existsSync(commander.tsconfig)) {
                    logger.error(`"${commander.tsconfig}" file was not found in the current directory`);
                    process.exit(1);
                } else {
                    let _file = path.join(
                        path.join(process.cwd(), path.dirname(this.configuration.mainData.tsconfig)),
                        path.basename(this.configuration.mainData.tsconfig)
                    );
                    // use the current directory of tsconfig.json as a working directory
                    cwd = _file.split(path.sep).slice(0, -1).join(path.sep);
                    logger.info('Using tsconfig', _file);

                    let tsConfigFile = readConfig(_file);
                    files = tsConfigFile.files;
                    if (files) {
                        files = handlePath(files, cwd);
                    }

                    if (!files) {
                        let exclude = tsConfigFile.exclude || [];

                        ExcludeParser.init(exclude, cwd);

                        let finder = require('findit')(cwd || '.');

                        finder.on('directory', function (dir, stat, stop) {
                            let base = path.basename(dir);
                            if (base === '.git' || base === 'node_modules') {
                                stop();
                            }
                        });

                        finder.on('file', (file, stat) => {
                            if (/(spec|\.d)\.ts/.test(file)) {
                                logger.warn('Ignoring', file);
                            } else if (ExcludeParser.testFile(file)) {
                                logger.warn('Excluding', file);
                            } else if (path.extname(file) === '.ts') {
                                logger.debug('Including', file);
                                files.push(file);
                            }
                        });

                        finder.on('end', () => {
                            super.setFiles(files);
                            super.testCoverage();
                        });
                    }

                    super.setFiles(files);
                    super.testCoverage();
                }
            } else if (commander.tsconfig && commander.args.length > 0) {
                this.configuration.mainData.tsconfig = commander.tsconfig;
                let sourceFolder = commander.args[0];
                if (!fs.existsSync(sourceFolder)) {
                    logger.error(`Provided source folder ${sourceFolder} was not found in the current directory`);
                    process.exit(1);
                } else {
                    logger.info('Using provided source folder');

                    if (!fs.existsSync(commander.tsconfig)) {
                        logger.error(`"${commander.tsconfig}" file was not found in the current directory`);
                        process.exit(1);
                    } else {
                        let tsConfigFile = readConfig(commander.tsconfig);
                        let exclude = tsConfigFile.exclude || [];

                        ExcludeParser.init(exclude, cwd);

                        let finder = require('findit')(path.resolve(sourceFolder));

                        finder.on('directory', function (dir, stat, stop) {
                            let base = path.basename(dir);
                            if (base === '.git' || base === 'node_modules') {
                                stop();
                            }
                        });

                        finder.on('file', (file, stat) => {
                            if (/(spec|\.d)\.ts/.test(file)) {
                                logger.warn('Ignoring', file);
                            } else if (ExcludeParser.testFile(file)) {
                                logger.warn('Excluding', file);
                            } else if (path.extname(file) === '.ts') {
                                logger.debug('Including', file);
                                files.push(file);
                            }
                        });

                        finder.on('end', () => {
                            super.setFiles(files);
                            super.generate();
                        });
                    }
                }
            } else {
                logger.error('tsconfig.json file was not found, please use -p flag');
                outputHelp();
            }
        }
    }
}
