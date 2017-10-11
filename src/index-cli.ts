import { logger } from './logger';


(function () {
    process.setMaxListeners(0);

    process.on('unhandledRejection', (err) => {
        logger.error(err);
        logger.error('Sorry, but there was a problem during parsing or generation of the documentation. Please fill an issue on github. (https://github.com/compodoc/compodoc/issues/new)');
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        logger.error(err);
        logger.error('Sorry, but there was a problem during parsing or generation of the documentation. Please fill an issue on github. (https://github.com/compodoc/compodoc/issues/new)');
        process.exit(1);
    });
})();

export { Application } from './app/application';
import { CliApplication } from './app/cli-application';


new CliApplication().generate();

